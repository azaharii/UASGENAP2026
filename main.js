// Firebase Imports (Sudah ditambahkan query dan where)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js"
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js"

// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBMSsNz6Dgss5vr8vlPbDdKgwOIn3dMBik",
  authDomain: "insancemerlang2025.firebaseapp.com",
  projectId: "insancemerlang2025",
  storageBucket: "insancemerlang2025.firebasestorage.app",
  messagingSenderId: "900746896855",
  appId: "1:900746896855:web:20cfd37822398ef034d792"
}

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FUNGSI LOGIN  ---
export async function login() {
  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value.trim();
  const statusElement = document.getElementById("status");

  statusElement.innerText = "Memverifikasi...";

  try {
    // Membuat query pencarian user berdasarkan username dan password
    const q = query(
      collection(db, "users"),
      where("username", "==", usernameInput),
      where("password", "==", passwordInput)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Jika querySnapshot tidak kosong, berarti data ditemukan
    if (!querySnapshot.empty) {
      // Simpan status login di localStorage
      localStorage.setItem("isLogin2", "true");
      statusElement.innerText = "Login berhasil!";
      
      // Redirect ke halaman utama
      window.location.href = "index.html";
    } else {
      statusElement.innerText = "Username atau password salah";
      statusElement.style.color = "red";
    }
  } catch (error) {
    console.error("Login Error: ", error);
    statusElement.innerText = "Terjadi kesalahan koneksi database.";
  }
}

// --- FUNGSI LOGOUT ---
export function logout() {
  localStorage.removeItem("isLogin2");
  window.location.href = "login.html";
}

// Referensi ke Koleksi Gudang / Barang
const barangCollection = collection(db, "inventaris_gudang");

// DOM Elements
const form = document.getElementById("inventory-form");
const itemIdInput = document.getElementById("item-id");
const kodeInput = document.getElementById("kode-barang");
const namaInput = document.getElementById("nama-barang");
const kategoriInput = document.getElementById("kategori");
const stokInput = document.getElementById("jumlah-stok");
const hargaInput = document.getElementById("harga-satuan");

const formTitle = document.getElementById("form-title");
const btnSubmit = document.getElementById("btn-submit");
const btnCancel = document.getElementById("btn-cancel");
const tableBody = document.getElementById("inventory-table-body");

// --- 1. FUNGSI MENAMPILKAN DATA (READ) ---
async function muatDataBarang() {
  // Hanya jalankan pemuatan data jika elemen tabel ada di halaman ini (Mencegah error di halaman login)
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888;">Memuat data...</td></tr>`;
  
  try {
    const querySnapshot = await getDocs(barangCollection);
    tableBody.innerHTML = ""; 

    if (querySnapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888;">Belum ada data barang di gudang.</td></tr>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const totalNilai = (data.Jumlah_stok || 0) * (data.Harga_satuan || 0);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${data.Kode_barang || '-'}</td>
        <td><b>${data.Nama_barang || '-'}</b></td>
        <td>${data.Kategori || '-'}</td>
        <td>${data.Jumlah_stok || 0}</td>
        <td>Rp ${(data.Harga_satuan || 0).toLocaleString('id-ID')}</td>
        <td>Rp ${totalNilai.toLocaleString('id-ID')}</td>
        <td>
          <div class="action-btns">
            <button type="button" class="btn btn-edit" data-id="${id}">Edit</button>
            <button type="button" class="btn btn-delete" data-id="${id}">Hapus</button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error("Gagal mengambil data: ", error);
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Gagal memuat data dari Firebase!</td></tr>`;
  }
}

// --- 2. EVENT DELEGATION (EDIT & HAPUS) ---
if (tableBody) {
  tableBody.addEventListener("click", async (e) => {
    const targetBtn = e.target;
    
    if (targetBtn.classList.contains("btn-edit")) {
      const id = targetBtn.getAttribute("data-id");
      try {
        const docRef = doc(db, "inventaris_gudang", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          itemIdInput.value = id;
          kodeInput.value = data.Kode_barang;
          namaInput.value = data.Nama_barang;
          kategoriInput.value = data.Kategori;
          stokInput.value = data.Jumlah_stok;
          hargaInput.value = data.Harga_satuan;

          formTitle.innerText = "✏️ Ubah Data Barang";
          btnSubmit.innerText = "Perbarui Data";
          btnCancel.style.display = "inline-block";
          form.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        console.error("Gagal mengambil rincian barang: ", error);
      }
    }

    if (targetBtn.classList.contains("btn-delete")) {
      const id = targetBtn.getAttribute("data-id");
      if (confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
        try {
          await deleteDoc(doc(db, "inventaris_gudang", id));
          alert("Barang berhasil dihapus!");
          if (itemIdInput.value === id) resetForm();
          muatDataBarang();
        } catch (error) {
          console.error("Gagal menghapus: ", error);
        }
      }
    }
  });
}

// --- 3. FUNGSI SIMPAN DATA (CREATE & UPDATE) ---
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idBarang = itemIdInput.value;
    const dataBarang = {
      Kode_barang: kodeInput.value.trim(),
      Nama_barang: namaInput.value.trim(),
      Kategori: kategoriInput.value,
      Jumlah_stok: parseInt(stokInput.value) || 0,
      Harga_satuan: parseFloat(hargaInput.value) || 0
    };

    try {
      if (idBarang === "") {
        await addDoc(barangCollection, dataBarang);
        alert("Barang baru berhasil ditambahkan!");
      } else {
        await updateDoc(doc(db, "inventaris_gudang", idBarang), dataBarang);
        alert("Perubahan data berhasil disimpan!");
        resetForm();
      }
      form.reset();
      muatDataBarang();
    } catch (error) {
      console.error("Error Saving: ", error);
    }
  });
}

function resetForm() {
  if (!form) return;
  itemIdInput.value = "";
  form.reset();
  formTitle.innerText = "Tambah Barang Baru";
  btnSubmit.innerText = "Simpan Barang";
  btnCancel.style.display = "none";
}

if (btnCancel) btnCancel.addEventListener("click", resetForm);

window.addEventListener("DOMContentLoaded", muatDataBarang);
