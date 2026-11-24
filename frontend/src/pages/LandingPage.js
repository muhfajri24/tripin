import React from "react";
import { Link } from "react-router-dom";
import { Map, Clock, Wallet, Route } from "lucide-react";
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="flex flex-wrap gap-4 justify-between items-center px-6 md:px-12 py-5">
        <Link to="/">
          <img alt="TRIPIN" src="/logo-full.png" className="h-10" />
        </Link>
        <div className="flex gap-4 items-center">
          <Link to="/my-itineraries">My Trips</Link>
          <Link className="btn-primary" to="/create">
            Plan a Trip
          </Link>
        </div>
      </nav>
      <main>
        <section className="bg-teal text-white px-6 md:px-12 py-20 md:py-28">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-yellow-trip font-bold uppercase tracking-widest text-sm">
                Yogyakarta · 1–3 hari · tanpa akun
              </p>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mt-5">
                Rencana perjalanan
                <br />
                <span className="text-yellow-trip">
                  yang bisa menyesuaikan.
                </span>
              </h1>
              <p className="mt-6 text-lg text-white/85">
                Susun jadwal berdasarkan waktu dan budget. Saat keberangkatan
                terlambat atau destinasi tutup, periksa konfliknya dan hitung
                ulang rencana Anda.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link className="btn-primary" to="/create">
                  Mulai rencana
                </Link>
                <Link
                  className="rounded-xl border border-white/50 px-5 py-3"
                  to="/discovery"
                >
                  Explore Yogyakarta
                </Link>
              </div>
              <p className="text-sm mt-5 text-white/70">
                Parser bahasa Indonesia berbasis aturan. Estimasi perjalanan dan
                data yang belum diketahui ditampilkan terbuka.
              </p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-3xl p-7 space-y-6">
              <Route size={40} className="text-yellow-trip" />
              <h2 className="text-2xl font-bold">
                Satu alur, dari brief sampai navigasi.
              </h2>
              {[
                ["01", "Tulis dan review kebutuhan"],
                ["02", "Periksa jadwal, biaya, dan sumber"],
                ["03", "Ubah kondisi, lalu lihat revisinya"],
              ].map(([n, text]) => (
                <p key={n} className="border-t border-white/20 pt-4">
                  <span className="text-yellow-trip mr-4">{n}</span>
                  {text}
                </p>
              ))}
            </div>
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-6">
          {[
            [
              Clock,
              "Waktu yang dihitung",
              "Durasi kunjungan, perkiraan perjalanan, jam buka yang diketahui, dan batas hari.",
            ],
            [
              Wallet,
              "Budget yang terbuka",
              "Tiket, food stops, kendaraan, dan penginapan; unknown bukan gratis.",
            ],
            [
              Map,
              "Tempat dengan sumber",
              "Katalog pilot terkurasi. Google Maps hanya untuk handoff navigasi.",
            ],
          ].map(([Icon, title, desc]) => (
            <article className="card" key={title}>
              <Icon className="text-teal mb-4" />
              <h2 className="font-bold text-xl">{title}</h2>
              <p className="mt-3">{desc}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="px-6 py-8 text-center text-sm text-charcoal-lighter">
        TRIPIN · Rencana tersimpan lokal di browser. Tidak ada booking atau
        klaim transaksi UMKM.
      </footer>
    </div>
  );
}
