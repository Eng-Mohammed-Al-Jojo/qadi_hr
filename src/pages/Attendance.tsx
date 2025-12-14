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
  const [manualUID, setManualUID] = useState<string>("");
  const qrRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const fetchAttendance = async () => {
    const q = query(collection(db, "attendance"), orderBy("checkIn", "desc"));
    const snap = await getDocs(q);
    setAttendance(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord))
    );
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleScan = async (uid: string) => {
    try {
      const today = new Date().toLocaleDateString();

      const q = query(
        collection(db, "attendance"),
        where("uid", "==", uid),
        where("date", "==", today)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        // تسجيل دخول جديد
        await addDoc(collection(db, "attendance"), {
          uid,
          name: "اسم الموظف", // يمكن لاحقًا جلب الاسم من Employees
          date: today,
          checkIn: serverTimestamp(),
        });
      } else {
        const record = snap.docs[0];
        if (!record.data().checkOut) {
          const checkInTime = record.data().checkIn.toDate();
          const checkOutTime = new Date();
          const hoursWorked =
            (checkOutTime.getTime() - checkInTime.getTime()) / 1000 / 3600;

          await updateDoc(doc(db, "attendance", record.id), {
            checkOut: serverTimestamp(),
            hoursWorked,
          });
        }
      }

      fetchAttendance();
      setManualUID("");
      setScanning(false);
      setScanError(null);
    } catch (err) {
      console.error(err);
      setScanError("حدث خطأ أثناء المسح أو التسجيل.");
    }
  };

  const startScanner = async (facingMode: "environment" | "user") => {
    if (!qrRef.current) return;

    html5QrCodeRef.current = new Html5Qrcode("qr-reader");
    try {
      await html5QrCodeRef.current.start(
        { facingMode },
        { fps: 10, qrbox: 250 },
        (decodedText) => handleScan(decodedText),
        (errorMessage) => {
          if (!errorMessage.includes("NotFoundException")) {
            console.warn("QR scan error:", errorMessage);
          }
        }
      );
    } catch (err: any) {
      console.warn(`فشل فتح الكاميرا (${facingMode}):`, err);
      if (facingMode === "environment") {
        // جرب الكاميرا الأمامية
        startScanner("user");
      } else {
        setScanError(
          "تعذر فتح الكاميرا. يمكنك إدخال UID الموظف يدوياً."
        );
      }
    }
  };

  useEffect(() => {
    if (scanning) startScanner("environment");

    return () => {
      html5QrCodeRef.current
        ?.stop()
        .catch(() => console.warn("الكاميرا لم تكن تعمل"));
    };
  }, [scanning]);

  return (
    <DashboardLayout>
      <div dir="rtl">
        <h2 className="text-xl font-bold mb-4 text-gray-900">سجل الحضور</h2>

        <button
          onClick={() => setScanning(!scanning)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded mb-4"
        >
          {scanning ? "إغلاق الكاميرا" : "فتح كاميرا QR"}
        </button>

        {/* كاميرا QR */}
        {scanning && <div id="qr-reader" ref={qrRef}></div>}

        {/* إدخال UID يدوي */}
        {(scanError || !scanning) && (
          <div className="mb-4">
            {scanError && <p className="text-red-500 mb-2">{scanError}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="أدخل UID الموظف يدوياً"
                value={manualUID}
                onChange={(e) => setManualUID(e.target.value)}
                className="border p-2 rounded flex-1"
              />
              <button
                onClick={() => handleScan(manualUID)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
              >
                تسجيل
              </button>
            </div>
          </div>
        )}

        {/* جدول الحضور */}
        <table className="min-w-full bg-white shadow-lg rounded-xl overflow-hidden mt-4">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-6">اسم الموظف</th>
              <th className="py-3 px-6">التاريخ</th>
              <th className="py-3 px-6">وقت الدخول</th>
              <th className="py-3 px-6">وقت الخروج</th>
              <th className="py-3 px-6">ساعات العمل</th>
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
                    ? new Date(a.checkIn.seconds * 1000).toLocaleTimeString()
                    : ""}
                </td>
                <td className="py-3 px-6">
                  {a.checkOut
                    ? new Date(a.checkOut.seconds * 1000).toLocaleTimeString()
                    : ""}
                </td>
                <td className="py-3 px-6">{a.hoursWorked?.toFixed(2) || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
