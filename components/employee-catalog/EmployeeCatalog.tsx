"use client";

import { Employee } from "@/types/employee";
import EmployeeCard from "./EmployeeCard";

interface EmployeeCatalogProps {
  employees: Employee[];
}

export default function EmployeeCatalog({ employees }: EmployeeCatalogProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Katalog Karyawan</h1>
          <p className="text-gray-600 mt-2">Total: {employees.length} Karyawan</p>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">Belum ada data karyawan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}
    </div>
  );
}
