"use client";

import Image from "next/image";
import { Employee } from "@/types/employee";

interface EmployeeCardProps {
  employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const defaultPhoto =
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 w-full bg-gray-200">
        <Image
          src={employee.photo || defaultPhoto}
          alt={employee.fullName}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{employee.fullName}</h3>
          <p className="text-sm text-blue-600 font-medium">{employee.position}</p>
          <p className="text-xs text-gray-500">{employee.department}</p>
        </div>

        <div className="space-y-2 border-t pt-3">
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-semibold">📧</span> {employee.email}
            </p>
            <p>
              <span className="font-semibold">📱</span> {employee.phone}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t text-xs text-gray-500">
          <p>Bergabung: {new Date(employee.joinDate).toLocaleDateString("id-ID")}</p>
        </div>
      </div>
    </div>
  );
}
