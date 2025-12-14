import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      const snap = await getDoc(doc(db, "employees", uid));
      if (!snap.exists()) {
        alert("هذا المستخدم غير مسجل في النظام");
        return;
      }

      const role = snap.data().role;
      if (role === "admin") navigate("/dashboard");
      else navigate("/attendance");
    } catch {
      alert("بيانات الدخول غير صحيحة");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-96">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">تسجيل الدخول</h2>

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          className="w-full p-3 mb-4 border rounded-xl focus:ring-2 focus:ring-yellow-400"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          className="w-full p-3 mb-4 border rounded-xl focus:ring-2 focus:ring-yellow-400"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-3 rounded-xl font-semibold transition"
        >
          دخول
        </button>
      </div>
    </div>
  );
};

export default Login;
