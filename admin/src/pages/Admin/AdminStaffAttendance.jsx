import React from "react";
import AdminAttendance from "./AdminAttendance";

const AdminStaffAttendance = () => (
  <AdminAttendance
    personType="staff"
    registryTitle="Staff Attendance Registry"
    searchPlaceholder="Search by Staff Name..."
    entityLabel="Staff"
  />
);

export default AdminStaffAttendance;
