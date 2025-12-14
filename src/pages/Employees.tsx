import { useEffect, useState, useRef } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
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

interface PopupState {
  open: boolean;
  type: "delete" | "edit" | null;
  employee?: Employee;
}

const QRPopup = ({
  open,
  onClose,
  employeeName,
  qrValue,
}: {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  qrValue: string;
}) => {
  const qrRef = useRef<SVGSVGElement>(null);
  if (!open) return null;

  const downloadQR = () => {
    if (!qrRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(qrRef.current);
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${employeeName}-QR.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
        <h3 className="text-lg font-bold mb-4">{employeeName}</h3>
        <QRCodeSVG ref={qrRef} value={qrValue} size={200} className="mx-auto mb-4" />
        <div className="flex flex-col gap-2">
          <button
            onClick={downloadQR}
            className="bg-blue-500 text-white py-2 rounded"
          >
            تحميل QR
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 py-2 rounded"
          >
            إغلاق
          </button>
        </div>
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
  const [qrPopup, setQrPopup] = useState<any>(null);
  const [popup, setPopup] = useState<PopupState>({ open: false, type: null });

  const fetchEmployees = async () => {
    const snap = await getDocs(collection(db, "employees"));
    setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Employee)));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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
      const cred = await createUserWithEmailAndPassword(auth, email, "123456");
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

    setName(""); setEmail(""); setRate(0);
    setDepartment(""); setBirthDate(""); setAddress("");
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

  const handleDelete = (employee: Employee) => {
    setPopup({ open: true, type: "delete", employee });
  };

  const confirmDelete = async () => {
    if (!popup.employee) return;
    await deleteDoc(doc(db, "employees", popup.employee.id));
    setPopup({ open: false, type: null });
    fetchEmployees();
  };

  return (
    <div dir="rtl">
      <DashboardLayout>
        {/* ===== Form ===== */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">بيانات الموظف</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">اسم الموظف</label>
              <input
                placeholder="أدخل الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">البريد الإلكتروني</label>
              <input
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">أجر الساعة</label>
              <input
                type="number"
                placeholder="مثال: 20"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">القسم</label>
              <input
                placeholder="مثال: المحاسبة"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">تاريخ الميلاد</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">العنوان</label>
              <input
                placeholder="المدينة / الحي"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <button
              onClick={addOrUpdateEmployee}
              className="col-span-1 sm:col-span-2 lg:col-span-3 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-lg py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
            >
              {editingId ? "💾 حفظ التعديلات" : "➕ إضافة موظف"}
            </button>
          </div>
        </div>

        {/* ===== Mobile Cards ===== */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {employees.map((e) => (
            <div key={e.id} className="bg-white rounded-xl shadow p-4 space-y-2">
              <p><b>الاسم:</b> {e.name}</p>
              <p><b>الإيميل:</b> {e.email}</p>
              <p><b>الأجر:</b> {e.hourlyRate}</p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setQrPopup({ open: true, qrValue: e.uid, name: e.name })}
                  className="bg-green-500 text-white py-2 px-3 rounded"
                >
                  QR
                </button>
                <button
                  onClick={() => handleEdit(e)}
                  className="bg-blue-500 text-white py-2 px-3 rounded"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(e)}
                  className="bg-red-500 text-white py-2 px-3 rounded"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ===== Desktop Table ===== */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3">الاسم</th>
                <th className="p-3">الإيميل</th>
                <th className="p-3">الأجر</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="p-3">{e.name}</td>
                  <td className="p-3">{e.email}</td>
                  <td className="p-3">{e.hourlyRate}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => setQrPopup({ open: true, qrValue: e.uid, name: e.name })}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      QR
                    </button>
                    <button
                      onClick={() => handleEdit(e)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(e)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Popups */}
        {qrPopup && (
          <QRPopup
            open={qrPopup.open}
            qrValue={qrPopup.qrValue}
            employeeName={qrPopup.name}
            onClose={() => setQrPopup(null)}
          />
        )}

        {popup.open && popup.type === "delete" && popup.employee && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
              <h3 className="text-lg font-bold mb-4">حذف الموظف</h3>
              <p className="mb-4 text-gray-800">هل أنت متأكد من حذف {popup.employee.name}؟</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 text-white py-2 px-4 rounded"
                >
                  حذف
                </button>
                <button
                  onClick={() => setPopup({ open: false, type: null })}
                  className="bg-gray-300 py-2 px-4 rounded"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      </DashboardLayout>
    </div>
  );
};

export default Employees;
