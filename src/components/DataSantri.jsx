import { useState } from "react";

function DataSantri() {
    const [santri, setSantri] = useState([
        {
            id: 1,
            nis: "S001",
            nama: "Ahmad Fauzan",
            jenisKelamin: "Laki-laki",
            kelompok: "Kelompok A",
        },
        {
            id: 2,
            nis: "S002",
            nama: "Muhammad Rizki",
            jenisKelamin: "Laki-laki",
            kelompok: "Kelompok B",
        },
    ]);

    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        nis: "",
        nama: "",
        jenisKelamin: "",
        kelompok: "",
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });

        // Hilangkan pesan error ketika field mulai diisi
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: "",
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nis.trim()) {
            newErrors.nis = "NIS wajib diisi.";
        }

        if (!formData.nama.trim()) {
            newErrors.nama = "Nama santri wajib diisi.";
        }

        if (!formData.jenisKelamin) {
            newErrors.jenisKelamin = "Jenis kelamin wajib dipilih.";
        }

        if (!formData.kelompok) {
            newErrors.kelompok = "Kelompok tahfidz wajib dipilih.";
        }

        // Validasi NIS unik
        const nisSudahAda = santri.some(
            (item) => item.nis.toLowerCase() === formData.nis.trim().toLowerCase()
        );

        if (formData.nis.trim() && nisSudahAda) {
            newErrors.nis = "NIS sudah digunakan. Silakan gunakan NIS lain.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Cek semua data sebelum disimpan
        if (!validateForm()) {
            return;
        }

        const dataBaru = {
            id: santri.length + 1,
            nis: formData.nis.trim(),
            nama: formData.nama.trim(),
            jenisKelamin: formData.jenisKelamin,
            kelompok: formData.kelompok,
        };

        setSantri([...santri, dataBaru]);

        // Reset form
        setFormData({
            nis: "",
            nama: "",
            jenisKelamin: "",
            kelompok: "",
        });

        setErrors({});
        setShowForm(false);
    };

    const handleDelete = (id) => {
        const konfirmasi = window.confirm(
            "Apakah Anda yakin ingin menghapus data santri ini?"
        );

        if (konfirmasi) {
            setSantri(santri.filter((item) => item.id !== id));
        }
    };

    const handleCloseModal = () => {
        setShowForm(false);

        setFormData({
            nis: "",
            nama: "",
            jenisKelamin: "",
            kelompok: "",
        });

        setErrors({});
    };

    return (
        <div className="santri-page">
            {/* HEADER */}
            <div className="page-header">
                <div>
                    <h1>Data Santri</h1>
                    <p>Kelola data santri Pondok Tahfidz RSQ</p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => setShowForm(true)}
                >
                    + Tambah Santri
                </button>
            </div>

            {/* TABLE */}
            <div className="content-card">
                <div className="table-header">
                    <h2>Daftar Santri</h2>

                    <span>{santri.length} Santri</span>
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>NIS</th>
                                <th>Nama Santri</th>
                                <th>Jenis Kelamin</th>
                                <th>Kelompok</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            {santri.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>{item.nis}</td>
                                    <td>{item.nama}</td>
                                    <td>{item.jenisKelamin}</td>
                                    <td>{item.kelompok}</td>

                                    <td>
                                        <button className="btn-edit">
                                            Edit
                                        </button>

                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL TAMBAH SANTRI */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Tambah Data Santri</h2>

                            <button
                                className="close-button"
                                onClick={handleCloseModal}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            {/* NIS */}
                            <div className="form-group">
                                <label htmlFor="nis">NIS</label>

                                <input
                                    type="text"
                                    id="nis"
                                    name="nis"
                                    placeholder="Masukkan NIS"
                                    value={formData.nis}
                                    onChange={handleChange}
                                    className={errors.nis ? "input-error" : ""}
                                />

                                {errors.nis && (
                                    <p className="error-message">
                                        {errors.nis}
                                    </p>
                                )}
                            </div>

                            {/* NAMA */}
                            <div className="form-group">
                                <label htmlFor="nama">Nama Santri</label>

                                <input
                                    type="text"
                                    id="nama"
                                    name="nama"
                                    placeholder="Masukkan nama santri"
                                    value={formData.nama}
                                    onChange={handleChange}
                                    className={errors.nama ? "input-error" : ""}
                                />

                                {errors.nama && (
                                    <p className="error-message">
                                        {errors.nama}
                                    </p>
                                )}
                            </div>

                            {/* JENIS KELAMIN */}
                            <div className="form-group">
                                <label htmlFor="jenisKelamin">
                                    Jenis Kelamin
                                </label>

                                <select
                                    id="jenisKelamin"
                                    name="jenisKelamin"
                                    value={formData.jenisKelamin}
                                    onChange={handleChange}
                                    className={
                                        errors.jenisKelamin ? "input-error" : ""
                                    }
                                >
                                    <option value="">
                                        Pilih jenis kelamin
                                    </option>
                                    <option value="Laki-laki">
                                        Laki-laki
                                    </option>
                                    <option value="Perempuan">
                                        Perempuan
                                    </option>
                                </select>

                                {errors.jenisKelamin && (
                                    <p className="error-message">
                                        {errors.jenisKelamin}
                                    </p>
                                )}
                            </div>

                            {/* KELOMPOK */}
                            <div className="form-group">
                                <label htmlFor="kelompok">
                                    Kelompok Tahfidz
                                </label>

                                <select
                                    id="kelompok"
                                    name="kelompok"
                                    value={formData.kelompok}
                                    onChange={handleChange}
                                    className={
                                        errors.kelompok ? "input-error" : ""
                                    }
                                >
                                    <option value="">
                                        Pilih kelompok
                                    </option>
                                    <option value="Kelompok A">
                                        Kelompok A
                                    </option>
                                    <option value="Kelompok B">
                                        Kelompok B
                                    </option>
                                    <option value="Kelompok C">
                                        Kelompok C
                                    </option>
                                </select>

                                {errors.kelompok && (
                                    <p className="error-message">
                                        {errors.kelompok}
                                    </p>
                                )}
                            </div>

                            {/* BUTTON */}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={handleCloseModal}
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataSantri;