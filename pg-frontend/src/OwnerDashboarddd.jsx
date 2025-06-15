//OwnerDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OwnerDashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchUsersAndPayments = async () => {
      try {
        const res = await axios.get("/api/owner/dashboard"); // Adjust endpoint
        setData(res.data);
      } catch (error) {
        console.error("Error fetching owner data:", error);
      }
    };

    fetchUsersAndPayments();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tenant Payments</h2>
      <table className="table-auto w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Payments</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, idx) => (
            <tr key={idx}>
              <td className="border px-4 py-2">{user.name}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">
                {user.payments.length > 0 ? (
                  user.payments.map((p, i) => (
                    <div key={i}>
                      ₹{p.amount} - {p.status} ({new Date(p.date).toLocaleDateString()})
                    </div>
                  ))
                ) : (
                  "No Payments"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OwnerDashboard;
