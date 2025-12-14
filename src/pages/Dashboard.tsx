import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";

const Dashboard = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const empSnap = await getDocs(collection(db, "employees"));
      setEmployeeCount(empSnap.size);

      const attendanceSnap = await getDocs(collection(db, "attendance"));
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayAtt = attendanceSnap.docs.filter(doc => {
        const t: any = doc.data().time?.toDate?.() || new Date();
        return t >= startOfDay;
      }).length;

      setTodayAttendance(todayAtt);
      setAbsentCount(empSnap.size - todayAtt);
    };

    fetchData();
  }, []);

  return (
    <div dir="rtl">

    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105">
          <p className="text-yellow-500 font-semibold mb-2">عدد الموظفين</p>
          <h2 className="text-3xl font-bold text-gray-900">{employeeCount}</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105">
          <p className="text-yellow-500 font-semibold mb-2">الحضور اليوم</p>
          <h2 className="text-3xl font-bold text-gray-900">{todayAttendance}</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105">
          <p className="text-yellow-500 font-semibold mb-2">غياب اليوم</p>
          <h2 className="text-3xl font-bold text-gray-900">{absentCount}</h2>
        </div>
      </div>
    </DashboardLayout>
    </div>
  );
};

export default Dashboard;
