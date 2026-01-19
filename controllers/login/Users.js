import Users from "../../models/UserModel/UserModel.js";
import argon2 from "argon2";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const generatePassword = (length = 10) => {
  const safeLength = Math.max(4, Math.min(length, 10));
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const pick = (set) => set[crypto.randomInt(set.length)];
  const passwordChars = [
    pick(upper),
    pick(lower),
    pick(digits),
    pick(symbols),
  ];

  for (let i = passwordChars.length; i < safeLength; i += 1) {
    passwordChars.push(pick(all));
  }

  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
};

export const getUsers = async (req, res) => {
  try {
    const response = await Users.findAll({
    });
    res.status(200).json({
      message: "Data USERS",
      Data: [response],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getUserByKdpegawai = async (req, res) => {
  try {
    const response = await Users.findOne({
      where: {
        kdpegawai: req.params.kdpegawai,
      },
    });
    res.status(200).json({
      message: "Data Akun Pengguna AO BPR NTB",
      Data: [response],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createUser = async (req, res) => {
  const {
    kdpegawai, 
    username, 
    namalengkap, 
    jabatan, 
    kdkantor, 
    cabangKantor,
    alamatKantor,
    telpKantor,
    email,
    role,
  } = req.body;

  console.log(req.body);
  const generatedPassword = generatePassword(10);
  const hashPassword = await argon2.hash(generatedPassword);
  try {
    await Users.create({
      kdpegawai: kdpegawai,
      username: username,
      jabatan: jabatan,
      namalengkap: namalengkap,
      email: email,
      kdkantor: kdkantor,
      cabangKantor: cabangKantor,
      alamatKantor: alamatKantor,
      telpKantor: telpKantor,
      password: hashPassword,
      role: role,
    });

    // Konfigurasi transporter email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // 🚨 hanya untuk pengembangan
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to: email, // Receiver email
      subject: "Konfirmasi Pendaftaran Akun Pegawai AO PT.BPR NTB PERSERODA",
      html: `
      <p>Halo <strong>${username}</strong>,</p>
      <p>Selamat! Pendaftaran akun <em>Account Officer</em> Anda berhasil. Berikut adalah informasi akun Anda:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Password:</strong> ${generatedPassword}</li>
        <li><strong>User:</strong> ${role}</li>
      </ul>
      <h3>Informasi Penting:</h3>
      <h3>Temukan Masalah atau Bug?</h3>
      <p>Jika Anda menemukan kendala atau bug pada website, silakan hubungi:</p>
      <p><strong>WhatsApp:</strong> 082147354774 (Perancang Website)</p>
      <p>Terima kasih telah bergabung dengan <em>PT.BPR NTB PERSERODA</em>. Kami berkomitmen untuk memberikan layanan terbaik kepada Anda.</p>
      <p>Salam hangat,<br/><strong>Tim IT PT.BPR NTB PERSERODA</strong></p>
    `,
    };

    // Kirim email
    await transporter.sendMail(mailOptions);

    res.status(201).json({ msg: "PEMBUATAN AKUN PENGGUNA TELAH BERHASIL, SILAHKAN CEK KONFIRMASI EMAIL ANDA!" });
  } catch (error) {
    console.error("Register Error:", error); // Tambahkan ini untuk melihat detail
    res.status(400).json({
      msg: error.message,
      errors: error.errors || null,
    });
  }
};

export const editPassword = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: {
        kdpegawai: req.params.kdpegawai,
      },
    });

    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

    const { oldPassword, newPassword, confNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confNewPassword) {
      return res.status(400).json({ msg: "Semua field wajib diisi!" });
    }

    const match = await argon2.verify(user.password, oldPassword);
    if (!match) {
      return res.status(400).json({ msg: "Password lama salah!" });
    }

    if (newPassword !== confNewPassword) {
      return res.status(400).json({ msg: "Password baru dan konfirmasi tidak cocok!" });
    }

    const hashPassword = await argon2.hash(newPassword);

    await Users.update(
      { password: hashPassword },
      { where: { kdpegawai: user.kdpegawai } }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // 🚨 hanya untuk pengembangan
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Notifikasi Perubahan Password",
      html: `
        <p>Halo <strong>${user.username}</strong>,</p>
        <p>Password akun Anda telah berhasil diubah.</p>
        <p>Jika Anda tidak merasa melakukan perubahan ini, segera hubungi kami untuk mengamankan akun Anda.</p>
        <p>Terima kasih,<br/><strong>Tim IT PT.BPR NTB PERSERODA</strong></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: "Password berhasil diperbarui. Silakan cek email Anda!" });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateAll = async (req, res) => {
  // Cari user berdasarkan Kode PEgawai
  const user = await Users.findOne({
    where: {
      kdpegawai: req.params.kdpegawai,
    },
  });

  if (!user) return res.status(404).json({ msg: "User not found" });

  // Ambil data dari request body
  const {
    kdpegawai,
    username,
    namalengkap,
    jabatan,
    kdkantor,
    cabangKantor,
    alamatKantor,
    telpKantor,
    email,
    password,
    confPassword,
    role,
  } = req.body;

  let hashPassword = user.password; 
  let passwordChanged = false; 

  if (password && password !== "") {
    if (password !== confPassword) {
      return res
        .status(400)
        .json({ msg: "Password and Confirm Password Don't Match!" });
    }
    hashPassword = await argon2.hash(password);
    passwordChanged = true; 
  }

  try {
    await Users.update(
      {
        username: username || user.username,
        email: email || user.email,
        namalengkap: namalengkap || user.namalengkap,
        kdkantor: kdkantor || user.kdkantor,
        cabangKantor: cabangKantor || user.cabangKantor,
        alamatKantor: alamatKantor || user.alamatKantor,
        telpKantor: telpKantor || user.telpKantor,
        kdpegawai: kdpegawai || user.kdpegawai,
        jabatan: jabatan || user.jabatan,
        password: hashPassword, 
        role: role || user.role,
      },
      {
        where: {
          kdpegawai: user.kdpegawai,
        },
      }
    );

    
    if (passwordChanged) {
      // Konfigurasi transporter email
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false, // 🚨 hanya untuk pengembangan
        },
      });

      // Opsi email
      const mailOptions = {
        from: process.env.EMAIL_USER, 
        to: user.email, 
        subject: "Notifikasi Perubahan Password",
        html: `
        <p>Halo <strong>${user.username}</strong>,</p>
        <p>Password akun Anda telah berhasil diubah.</p>
        <p>Jika Anda tidak merasa melakukan perubahan ini, segera hubungi kami untuk mengamankan akun Anda.</p>
        <p>Terima kasih,<br/><strong>Tim IT PT.BPR NTB PERSERODA</strong></p>
      `,
      };

      // Kirim email
      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ msg: "Telah Berhasi Diganti, Silahkan Cek Email!" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const updateUser = async (req, res) => {
  const user = await Users.findOne({
    where: {
      kdpegawai: req.params.kdpegawai,
    },
  });

  if (!user) return res.status(404).json({ msg: "Akun Pengguna Tidak Ditemukan!" });

  // Ambil data dari request body
  const {
    kdpegawai,
    username,
    namalengkap,
    jabatan,
    kdkantor,
    cabangKantor,
    alamatKantor,
    telpKantor,
    email,
    role,
  } = req.body;

  const hashPassword = user.password;

  try {
    
    await Users.update(
      {
        username: username || user.username,
        email: email || user.email,
        namalengkap: namalengkap || user.namalengkap,
        kdkantor: kdkantor || user.kdkantor,
        cabangKantor: cabangKantor || user.cabangKantor,
        alamatKantor: alamatKantor || user.alamatKantor,
        telpKantor: telpKantor || user.telpKantor,
        kdpegawai: kdpegawai || user.kdpegawai,
        jabatan: jabatan || user.jabatan,
        password: hashPassword, 
        role: role || user.role,
      },
      {
        where: {
          kdpegawai: user.kdpegawai,
        },
      }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // 🚨 hanya untuk pengembangan
      },
    });

    // Opsi email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email || user.email, // Kirim ke email terbaru (jika berubah)
      subject: "Notifikasi Perubahan Data Akun",
      html: `
        <p>Halo <strong>${username || user.username}</strong>,</p>
        <p>Data akun Anda telah berhasil diperbarui.</p>
        <p>Berikut adalah data terbaru:</p>
        <ul>
          <li><strong>Nama Lengkap:</strong> ${namalengkap || user.namalengkap}</li>
          <li><strong>Kode Pegawai:</strong> ${kdpegawai || user.kdpegawai}</li>
          <li><strong>Kode Kantor:</strong> ${kdkantor || user.kdkantor}</li>
          <li><strong>Email:</strong> ${email || user.email}</li>
          <li><strong>Role:</strong> ${role || user.role}</li>
        </ul>
        <p>Jika Anda tidak merasa melakukan perubahan ini, segera hubungi kami untuk mengamankan akun Anda.</p>
        <p>Terima kasih,<br/><strong>Tim IT PT>BPR NTB PERSERODA</strong></p>
      `,
    };

    // Kirim email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: "Data berhasil diperbarui dan email telah dikirim" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};



export const deleteUser = async (req, res) => {
  const user = await Users.findOne({
    where: {
      kdpegawai: req.params.kdpegawai,
    },
  });
  if (!user) return res.status(404).json({ msg: "Akun Pengguna Tidak Ditemukan!" });
  try {
    await Users.destroy({
      where: {
        kdpegawai: user.kdpegawai,
      },
    });
    res.status(200).json({ msg: "Akun Pengguna Berhasil Dihapus!" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};
