
import "./App.css";
import { mahasiswa, mahasiswaList, produkList } from "./data";

function App() {
  const { nama, nim, jurusan, semester, ipk } = mahasiswa;
  const [mahasiswaPertama, mahasiswaKedua] = mahasiswaList;

  const mahasiswaTeknik = mahasiswaList.filter(
    (student) => student.jurusan === "Teknik Informatika"
  );

  const produkTerjangkau = produkList.filter(
    (product) => product.price < 1000000
  );

  const produkTersedia = produkList.filter(
    (product) => product.stock > 0
  );

  const produkPilihan = produkList.find(
    (product) => product.id === 2
  );

  const totalNilaiProduk = produkList.reduce(
    (total, product) => total + product.price * product.stock,
    0
  );

  const totalStok = produkList.reduce(
    (total, product) => total + product.stock,
    0
  );

  const mahasiswaDicari = mahasiswaList.find(
    (student) => student.nim === "231003"
  );

  const totalIPK = mahasiswaList.reduce(
    (total, student) => total + student.ipk,
    0
  );

  const rataRataIPK = totalIPK / mahasiswaList.length;

  const produkDiskon = {
    ...produkList[0],
    price: produkList[0].price * 0.9,
  };

  return (
    <main className="container">
      <h1>Data Mahasiswa</h1>

      <section>
        <h2>Biodata Mahasiswa</h2>
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>NIM</th>
              <th>Jurusan</th>
              <th>Semester</th>
              <th>IPK</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{nama}</td>
              <td>{nim}</td>
              <td>{jurusan}</td>
              <td>{semester}</td>
              <td>{ipk}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Data Awal</h2>
        <table>
          <thead>
            <tr>
              <th>Keterangan</th>
              <th>Hasil</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mahasiswa pertama</td>
              <td>{mahasiswaPertama.nama}</td>
            </tr>
            <tr>
              <td>Mahasiswa kedua</td>
              <td>{mahasiswaKedua.nama}</td>
            </tr>
            <tr>
              <td>Jumlah produk</td>
              <td>{produkList.length}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Daftar Produk</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
            </tr>
          </thead>
          <tbody>
            {produkList.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>Rp{product.price.toLocaleString("id-ID")}</td>
                <td>{product.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Produk Terjangkau</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Produk</th>
              <th>Harga</th>
            </tr>
          </thead>
          <tbody>
            {produkTerjangkau.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>Rp{product.price.toLocaleString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Produk Tersedia</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Produk</th>
              <th>Stok</th>
            </tr>
          </thead>
          <tbody>
            {produkTersedia.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Produk Pilihan</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
            </tr>
          </thead>
          <tbody>
            {produkPilihan ? (
              <tr>
                <td>{produkPilihan.id}</td>
                <td>{produkPilihan.name}</td>
                <td>{produkPilihan.category}</td>
                <td>
                  Rp{produkPilihan.price.toLocaleString("id-ID")}
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="4">Produk tidak ditemukan</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Ringkasan Produk</h2>
        <table>
          <thead>
            <tr>
              <th>Keterangan</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total stok</td>
              <td>{totalStok} unit</td>
            </tr>
            <tr>
              <td>Nilai persediaan</td>
              <td>
                Rp{totalNilaiProduk.toLocaleString("id-ID")}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Daftar Mahasiswa</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama</th>
              <th>NIM</th>
              <th>Jurusan</th>
              <th>Semester</th>
              <th>IPK</th>
            </tr>
          </thead>
          <tbody>
            {mahasiswaList.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.nama}</td>
                <td>{student.nim}</td>
                <td>{student.jurusan}</td>
                <td>{student.semester}</td>
                <td>{student.ipk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Mahasiswa Teknik Informatika</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama</th>
              <th>NIM</th>
              <th>Semester</th>
              <th>IPK</th>
            </tr>
          </thead>
          <tbody>
            {mahasiswaTeknik.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.nama}</td>
                <td>{student.nim}</td>
                <td>{student.semester}</td>
                <td>{student.ipk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Cari Mahasiswa</h2>
        <table>
          <thead>
            <tr>
              <th>NIM yang Dicari</th>
              <th>Nama Mahasiswa</th>
              <th>Jurusan</th>
            </tr>
          </thead>
          <tbody>
            {mahasiswaDicari ? (
              <tr>
                <td>{mahasiswaDicari.nim}</td>
                <td>{mahasiswaDicari.nama}</td>
                <td>{mahasiswaDicari.jurusan}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan="3">Mahasiswa tidak ditemukan</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Rata-Rata IPK</h2>
        <table>
          <thead>
            <tr>
              <th>Total IPK</th>
              <th>Jumlah Mahasiswa</th>
              <th>Rata-Rata IPK</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{totalIPK.toFixed(2)}</td>
              <td>{mahasiswaList.length}</td>
              <td>{rataRataIPK.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Produk Diskon</h2>
        <table>
          <thead>
            <tr>
              <th>Nama Produk</th>
              <th>Harga Asli</th>
              <th>Diskon</th>
              <th>Harga Setelah Diskon</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{produkDiskon.name}</td>
              <td>
                Rp{produkList[0].price.toLocaleString("id-ID")}
              </td>
              <td>10%</td>
              <td>
                Rp{produkDiskon.price.toLocaleString("id-ID")}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default App;