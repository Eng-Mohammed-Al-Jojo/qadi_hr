import { useEffect, useRef, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import DashboardLayout from "../layouts/DashboardLayout";
import { Html5Qrcode } from "html5-qrcode";

interface AttendanceRecord {
  id: string;
  uid: string;
  name: string;
  date: string;
  checkIn: any;
  checkOut?: any;
  hoursWorked?: number;
}

const Attendance = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualUID, setManualUID] = useState("");

  const qrRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  /* =======================
     جلب سجل الحضور
  ======================= */
  const fetchAttendance = async () => {
    const q = query(collection(db, "attendance"), orderBy("checkIn", "desc"));
    const snap = await getDocs(q);
    setAttendance(
      snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as AttendanceRecord)
      )
    );
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  /* =======================
     تسجيل دخول / خروج
  ======================= */
  const handleScan = async (uid: string) => {
    if (!uid || isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const today = new Date().toISOString().split("T")[0];

      // جلب بيانات الموظف
      const empSnap = await getDocs(
        query(collection(db, "employees"), where("uid", "==", uid))
      );

      if (empSnap.empty) {
        throw new Error("الموظف غير موجود");
      }

      const employee = empSnap.docs[0].data();

      // تحقق من سجل اليوم
      const q = query(
        collection(db, "attendance"),
        where("uid", "==", uid),
        where("date", "==", today)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        // تسجيل دخول
        await addDoc(collection(db, "attendance"), {
          uid,
          name: employee.name,
          date: today,
          checkIn: serverTimestamp(),
        });
      } else {
        const record = snap.docs[0];
        if (!record.data().checkOut) {
          const checkInTime = record.data().checkIn.toDate();
          const hoursWorked =
            (Date.now() - checkInTime.getTime()) / 36e5;

          await updateDoc(doc(db, "attendance", record.id), {
            checkOut: serverTimestamp(),
            hoursWorked,
          });
        }
      }

      await fetchAttendance();
      setScanning(false);
      setScanError(null);
      setManualUID("");
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "خطأ أثناء تسجيل الحضور");
    } finally {
      isProcessingRef.current = false;
      stopScanner();
    }
  };

  /* =======================
     تشغيل الكاميرا
  ======================= */
  const startScanner = async () => {
    if (!qrRef.current || html5QrCodeRef.current) return;

    const scanner = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => handleScan(decodedText),
        () => {}
      );
    } catch (err) {
      console.warn("فشل فتح الكاميرا", err);
      setScanError("تعذر فتح الكاميرا، استخدم الإدخال اليدوي");
    }
  };

  /* =======================
     إيقاف الكاميرا
  ======================= */
  const stopScanner = async () => {
    if (!html5QrCodeRef.current) return;

    try {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
    } catch {}
    html5QrCodeRef.current = null;
  };

  useEffect(() => {
    if (scanning) startScanner();
    else stopScanner();

    return () => {
      stopScanner();
    };
  }, [scanning]);

  return (
     <div dir="rtl">
    <DashboardLayout>
     
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          سجل الحضور
        </h2>

        {/* زر الكاميرا */}
        <button
          onClick={() => setScanning((s) => !s)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded mb-4"
        >
          {scanning ? "إغلاق الكاميرا" : "فتح كاميرا QR"}
        </button>

        {/* الكاميرا */}
        {scanning && (
          <div
            id="qr-reader"
            ref={qrRef}
            className="w-full max-w-sm mb-4"
          />
        )}

        {/* إدخال يدوي */}
        {(scanError || !scanning) && (
          <div className="mb-4">
            {scanError && (
              <p className="text-red-500 mb-2">{scanError}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="UID الموظف"
                value={manualUID}
                onChange={(e) => setManualUID(e.target.value)}
                className="border p-2 rounded flex-1"
              />
              <button
                onClick={() => handleScan(manualUID)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                تسجيل
              </button>
            </div>
          </div>
        )}

        {/* جدول الحضور */}
        <table className="min-w-full bg-white shadow-lg rounded-xl overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-6">الاسم</th>
              <th className="py-3 px-6">التاريخ</th>
              <th className="py-3 px-6">الدخول</th>
              <th className="py-3 px-6">الخروج</th>
              <th className="py-3 px-6">الساعات</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a) => (
              <tr
                key={a.id}
                className="border-b hover:bg-yellow-100 transition text-right"
              >
                <td className="py-3 px-6">{a.name}</td>
                <td className="py-3 px-6">{a.date}</td>
                <td className="py-3 px-6">
                  {a.checkIn
                    ? new Date(
                        a.checkIn.seconds * 1000
                      ).toLocaleTimeString()
                    : ""}
                </td>
                <td className="py-3 px-6">
                  {a.checkOut
                    ? new Date(
                        a.checkOut.seconds * 1000
                      ).toLocaleTimeString()
                    : ""}
                </td>
                <td className="py-3 px-6">
                  {a.hoursWorked?.toFixed(2) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      
    </DashboardLayout>
    </div>
  );
};

export default Attendance;
