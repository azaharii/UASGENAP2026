// firewall sederhana untuk mencegah akses aplikasi
// tanpa login terlebih dahulu
const isLogin = localStorage.getItem("isLogin2")

if (isLogin !== "true") {
    window.location.href = "login.html"
}
