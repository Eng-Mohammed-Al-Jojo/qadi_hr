import { useEffect, useState, useRef } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import DashboardLayout from "../layouts/DashboardLayout";
import { QRCodeSVG } from "qrcode.react";

interface Employee {
  id: string;
  uid: string;
  name: string;
  email: string;
  hourlyRate: number;
  department?: string;
  birthDate?: string;
  address?: string;
  role?: string;
  active?: boolean;
}

interface QRPopupProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  qrValue: string;
}

const QRPopup: React.FC<QRPopupProps> = ({ open, onClose, employeeName, qrValue }) => {
  const qrRef = useRef<SVGSVGElement>(null);

  if (!open) return null;

  const downloadQR = () => {
    if (!qrRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(qrRef.current);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${employeeName}-QR.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-80 flex flex-col items-center">
        <h3 className="text-lg font-bold mb-4">{employeeName} QR Code</h3>
        <QRCodeSVG ref={qrRef} value={qrValue} size={200} className="mb-4" />
        <button
          onClick={downloadQR}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-2"
        >
          تحميل QR
        </button>
        <button
          onClick={onClose}
          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rate, setRate] = useState(0);
  const [department, setDepartment] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ id: string; name: string } | null>(null);
  const [qrPopup, setQrPopup] = useState<{ open: boolean; qrValue: string; name: string } | null>(null);

  const fetchEmployees = async () => {
    const snap = await getDocs(collection(db, "employees"));
    setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Employee)));
  };

  useEffect(() => { fetchEmployees(); }, []);

  const addOrUpdateEmployee = async () => {
    if (editingId) {
      await updateDoc(doc(db, "employees", editingId), {
        name,
        email,
        hourlyRate: rate,
        department,
        birthDate,
        address,
      });
      setEditingId(null);
    } else {
      const password = "123456";
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, "employees"), {
        uid: cred.user.uid,
        name,
        email,
        hourlyRate: rate,
        department,
        birthDate,
        address,
        role: "employee",
        active: true,
        createdAt: serverTimestamp(),
      });
    }

    setName("");
    setEmail("");
    setRate(0);
    setDepartment("");
    setBirthDate("");
    setAddress("");
    fetchEmployees();
  };

  const handleEdit = (employee: Employee) => {
    setName(employee.name);
    setEmail(employee.email);
    setRate(employee.hourlyRate);
    setDepartment(employee.department || "");
    setBirthDate(employee.birthDate || "");
    setAddress(employee.address || "");
    setEditingId(employee.id);
  };

  const handleDelete = (id: string, name: string) => {
    setPopup({ id, name });
  };

  const confirmDelete = async () => {
    if (!popup) return;
    await deleteDoc(doc(db, "employees", popup.id));
    setPopup(null);
    fetchEmployees();
  };

  return (
    <div dir="rtl">
      <DashboardLayout>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">إدارة الموظفين</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
          <input placeholder="اسم الموظف" className="border p-3 rounded-xl focus:ring-2 focus:ring-yellow-400" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="البريد الإلكتروني" className="border p-3 rounded-xl focus:ring-2 focus:ring-yellow-400" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="number" placeholder="أجر الساعة" className="border p-3 rounded-xl focus:ring-2 focus:ring-yellow-400" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          <input placeholder="القسم" className="border p-3 rounded-xl focus:ring-2 focus:ring-yellow-400" value={department} onChange={(e) => setDepartment(e.target.value)} />
          <input type="date" placeholder="تاريخ الميلاد" className="border p-3 rounded-xl focus:ring-2 focus:ring-yellow-400" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          <input placeholder="العنوان" className="border p-3 rounded-xl focus:ring-2 focus:ring-yellow-400" value={address} onChange={(e) => setAddress(e.target.value)} />
          <button onClick={addOrUpdateEmployee} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-3 rounded-xl font-semibold col-span-3 transition">
            {editingId ? "حفظ التعديلات" : "إضافة موظف"}
          </button>
        </div>

        <table className="min-w-full bg-white shadow-lg rounded-xl overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-6">الاسم</th>
              <th className="py-3 px-6">الإيميل</th>
              <th className="py-3 px-6">أجر الساعة</th>
              <th className="py-3 px-6">القسم</th>
              <th className="py-3 px-6">تاريخ الميلاد</th>
              <th className="py-3 px-6">العنوان</th>
              <th className="py-3 px-6">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b hover:bg-yellow-100 transition text-right">
                <td className="py-3 px-6">{e.name}</td>
                <td className="py-3 px-6">{e.email}</td>
                <td className="py-3 px-6">{e.hourlyRate}</td>
                <td className="py-3 px-6">{e.department}</td>
                <td className="py-3 px-6">{e.birthDate}</td>
                <td className="py-3 px-6">{e.address}</td>
                <td className="py-3 px-6 flex gap-2 justify-end">
                  <button onClick={() => setQrPopup({ open: true, qrValue: e.uid, name: e.name })} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition">QR</button>
                  <button onClick={() => handleEdit(e)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">تعديل</button>
                  <button onClick={() => handleDelete(e.id, e.name)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {popup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 text-center">
              <p className="mb-4 text-gray-900">
                هل أنت متأكد أنك تريد حذف {popup.name}؟
              </p>
              <div className="flex justify-center gap-4">
                <button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition">حذف</button>
                <button onClick={() => setPopup(null)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded transition">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {qrPopup && (
          <QRPopup
            open={qrPopup.open}
            qrValue={qrPopup.qrValue}
            employeeName={qrPopup.name}
            onClose={() => setQrPopup(null)}
          />
        )}

      </DashboardLayout>
    </div>
  );
};

export default Employees;
