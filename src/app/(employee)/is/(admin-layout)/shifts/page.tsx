"use client";
import { useEffect, useState } from "react";
import {
  Clock,
  Users,
  Calendar,
  Timer,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Check,
  Trash2,
  Edit2,
  Save,
  Eye,
  Play,
  PowerOff,
  Sparkles,
} from "lucide-react";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { getShifts, registerShift, RegisterShiftPayload } from "@/src/services/shifts.service";
import { toast } from "sonner";

// ── Types ──
interface Availability {
  empName: string;
  startTime: string;
  endTime: string;
}

interface ShiftBlock {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  maxSlots: number;
  assignedEmployees: string[];
}

interface DaySchedule {
  date: string;
  fullDate: string;
  dayLabel: string;
  availabilities: Availability[];
  shifts: ShiftBlock[];
}

interface EmployeeInfo {
  name: string;
  type: "fulltime" | "parttime";
  hourlyRate: number;
}

interface IFormattedShift {
  date: string;
  start_time: string;
  end_time: string;
  shift_status: string;
  employee_info: string;
}

// ── Data ──
const employees: EmployeeInfo[] = [
  { name: "Nguyễn Văn An", type: "fulltime", hourlyRate: 0 },
  { name: "Trần Thị Bình", type: "fulltime", hourlyRate: 0 },
  { name: "Lê Minh Cường", type: "fulltime", hourlyRate: 0 },
  { name: "Phạm Thu Dung", type: "parttime", hourlyRate: 45000 },
  { name: "Hoàng Đức Em", type: "parttime", hourlyRate: 42000 },
  { name: "Vũ Thị Phương", type: "parttime", hourlyRate: 45000 },
  { name: "Đỗ Quốc Bảo", type: "fulltime", hourlyRate: 0 },
  { name: "Ngô Thanh Tâm", type: "parttime", hourlyRate: 40000 },
];

const getWeek = (option = "current") => {
  const today = new Date();
  const currentDay = today.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;

  const mondayDate = new Date(today);
  mondayDate.setDate(today.getDate() - distanceToMonday);

  if (option === "next") {
    mondayDate.setDate(mondayDate.getDate() + 7);
  }

  const weekDates = [];

  for (let i = 0; i < 7; i++) {
    const dateItem = new Date(mondayDate);
    dateItem.setDate(mondayDate.getDate() + i);
    const year = dateItem.getFullYear();
    const month = String(dateItem.getMonth() + 1).padStart(2, "0");
    const day = String(dateItem.getDate()).padStart(2, "0");

    weekDates.push(`${year}-${month}-${day}`);
  }

  return weekDates;
};

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const currentWeekLabel = `${getWeek("current")[0]} - ${getWeek("current")[6]}`;
const nextWeekDates = getWeek("next");
const nextWeekLabel = `${getWeek("next")[0]} - ${getWeek("next")[6]}`;

let _id = 1;
function genId() {
  return "S" + _id++;
}

function getHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.round(((eh * 60 + em - sh * 60 - sm) / 60) * 10) / 10;
}
function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}
function initials(name: string) {
  return name
    .split(" ")
    .map(w => w[0])
    .slice(-2)
    .join("");
}

// Predefined color per employee for visual distinction
const empColors = [
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400" },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400" },
  { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-400" },
  { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200", dot: "bg-pink-400" },
  { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-400" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-400" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-400" },
];
function getEmpColor(name: string) {
  const idx = employees.findIndex(e => e.name === name);
  return empColors[idx >= 0 ? idx % empColors.length : 0];
}

const shiftTimeColors = (start: string) => {
  const h = parseInt(start.split(":")[0]);
  if (h < 11) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-400" };
  if (h < 15) return { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", bar: "bg-sky-400" };
  if (h < 18) return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", bar: "bg-blue-400" };
  return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", bar: "bg-purple-400" };
};

// Timeline constants
const TIMELINE_START = 6; // 6:00
const TIMELINE_END = 24; // 24:00
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;
const timelineMarkers = Array.from({ length: TIMELINE_HOURS + 1 }, (_, i) => TIMELINE_START + i);

function timeToPercent(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h + m / 60 - TIMELINE_START) / TIMELINE_HOURS) * 100;
}

const getLocalDateString = (utcDateStr: string) => {
  const d = new Date(utcDateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function buildCurrentWeek(): DaySchedule[] {
  const data: [string, [string, string, string, number, string[]][]][] = [
    // T2: Trần Thị Bình ca gãy (sáng + tối), Đỗ Quốc Bảo ca gãy
    [
      "30/03",
      [
        ["07:00 - 12:00", "07:00", "12:00", 3, ["Nguyễn Văn An", "Trần Thị Bình", "Phạm Thu Dung"]],
        ["12:00 - 18:00", "12:00", "18:00", 3, ["Lê Minh Cường", "Đỗ Quốc Bảo", "Vũ Thị Phương"]],
        ["18:00 - 22:30", "18:00", "22:30", 3, ["Trần Thị Bình", "Ngô Thanh Tâm", "Đỗ Quốc Bảo"]],
      ],
    ],
    // T3: Nguyễn Văn An ca gãy (sáng + tối)
    [
      "31/03",
      [
        ["08:00 - 13:00", "08:00", "13:00", 3, ["Nguyễn Văn An", "Lê Minh Cường", "Đỗ Quốc Bảo"]],
        ["13:00 - 18:30", "13:00", "18:30", 3, ["Trần Thị Bình", "Hoàng Đức Em", "Vũ Thị Phương"]],
        ["18:30 - 23:00", "18:30", "23:00", 3, ["Nguyễn Văn An", "Phạm Thu Dung", "Ngô Thanh Tâm"]],
      ],
    ],
    // T4 (hôm nay): Trần Thị Bình ca gãy (sáng + tối), Lê Minh Cường ca gãy
    [
      "01/04",
      [
        ["07:00 - 11:30", "07:00", "11:30", 3, ["Trần Thị Bình", "Phạm Thu Dung", "Lê Minh Cường"]],
        ["12:00 - 18:00", "12:00", "18:00", 3, ["Nguyễn Văn An", "Ngô Thanh Tâm", "Hoàng Đức Em"]],
        ["18:00 - 23:00", "18:00", "23:00", 3, ["Trần Thị Bình", "Đỗ Quốc Bảo", "Lê Minh Cường"]],
      ],
    ],
    // T5: Phạm Thu Dung ca gãy, Trần Thị Bình ca liền
    [
      "02/04",
      [
        ["07:00 - 12:00", "07:00", "12:00", 3, ["Trần Thị Bình", "Phạm Thu Dung", "Vũ Thị Phương"]],
        ["13:00 - 18:00", "13:00", "18:00", 3, ["Nguyễn Văn An", "Đỗ Quốc Bảo", "Lê Minh Cường"]],
        ["18:00 - 23:00", "18:00", "23:00", 3, ["Phạm Thu Dung", "Hoàng Đức Em", "Ngô Thanh Tâm"]],
      ],
    ],
    // T6: Lê Minh Cường ca gãy, Ngô Thanh Tâm ca gãy
    [
      "03/04",
      [
        ["07:30 - 12:00", "07:30", "12:00", 4, ["Lê Minh Cường", "Ngô Thanh Tâm", "Đỗ Quốc Bảo", "Trần Thị Bình"]],
        ["13:00 - 19:00", "13:00", "19:00", 3, ["Nguyễn Văn An", "Phạm Thu Dung", "Vũ Thị Phương"]],
        ["19:00 - 23:00", "19:00", "23:00", 3, ["Lê Minh Cường", "Ngô Thanh Tâm", "Hoàng Đức Em"]],
      ],
    ],
    // T7: Trần Thị Bình ca gãy (sáng + tối)
    [
      "04/04",
      [
        ["08:00 - 13:00", "08:00", "13:00", 3, ["Trần Thị Bình", "Nguyễn Văn An", "Hoàng Đức Em"]],
        ["13:00 - 18:00", "13:00", "18:00", 3, ["Lê Minh Cường", "Đỗ Quốc Bảo", "Vũ Thị Phương"]],
        ["18:00 - 22:00", "18:00", "22:00", 3, ["Trần Thị Bình", "Ngô Thanh Tâm", "Phạm Thu Dung"]],
      ],
    ],
    // CN: Ít NV hơn
    [
      "05/04",
      [
        ["09:00 - 14:00", "09:00", "14:00", 2, ["Phạm Thu Dung", "Nguyễn Văn An"]],
        ["14:00 - 20:00", "14:00", "20:00", 3, ["Ngô Thanh Tâm", "Vũ Thị Phương", "Trần Thị Bình"]],
      ],
    ],
  ];
  return data.map(([date, shifts], i) => ({
    date: date as string,
    fullDate: date + "/2026",
    dayLabel: dayLabels[i],
    availabilities: [],
    shifts: shifts.map(([label, st, et, max, assigned]) => ({
      id: genId(),
      label: label as string,
      startTime: st as string,
      endTime: et as string,
      maxSlots: max as number,
      assignedEmployees: assigned as string[],
    })),
  }));
}

function buildNextWeek(): DaySchedule[] {
  // Employees have already registered their availability
  const avails: Record<string, Availability[]> = {
    "06/04": [
      { empName: "Nguyễn Văn An", startTime: "07:00", endTime: "12:00" },
      { empName: "Nguyễn Văn An", startTime: "17:00", endTime: "22:00" }, // ca gãy
      { empName: "Trần Thị Bình", startTime: "07:00", endTime: "12:00" },
      { empName: "Trần Thị Bình", startTime: "18:00", endTime: "23:00" }, // ca gãy
      { empName: "Lê Minh Cường", startTime: "12:00", endTime: "22:00" },
      { empName: "Phạm Thu Dung", startTime: "07:00", endTime: "13:00" },
      { empName: "Đỗ Quốc Bảo", startTime: "14:00", endTime: "23:00" },
      { empName: "Ngô Thanh Tâm", startTime: "17:00", endTime: "23:00" },
    ],
    "07/04": [
      { empName: "Nguyễn Văn An", startTime: "07:00", endTime: "14:00" },
      { empName: "Lê Minh Cường", startTime: "07:00", endTime: "12:00" },
      { empName: "Lê Minh Cường", startTime: "16:00", endTime: "22:00" }, // ca gãy
      { empName: "Vũ Thị Phương", startTime: "10:00", endTime: "20:00" },
      { empName: "Đỗ Quốc Bảo", startTime: "08:00", endTime: "13:00" },
      { empName: "Đỗ Quốc Bảo", startTime: "17:00", endTime: "22:00" }, // ca gãy
      { empName: "Ngô Thanh Tâm", startTime: "14:00", endTime: "22:00" },
    ],
    "08/04": [
      { empName: "Trần Thị Bình", startTime: "07:00", endTime: "12:00" },
      { empName: "Trần Thị Bình", startTime: "17:00", endTime: "22:00" }, // ca gãy
      { empName: "Phạm Thu Dung", startTime: "09:00", endTime: "18:00" },
      { empName: "Hoàng Đức Em", startTime: "12:00", endTime: "21:00" },
      { empName: "Vũ Thị Phương", startTime: "07:00", endTime: "14:00" },
    ],
    "09/04": [
      { empName: "Nguyễn Văn An", startTime: "08:00", endTime: "13:00" },
      { empName: "Nguyễn Văn An", startTime: "17:00", endTime: "22:00" }, // ca gãy
      { empName: "Trần Thị Bình", startTime: "13:00", endTime: "22:00" },
      { empName: "Lê Minh Cường", startTime: "07:00", endTime: "15:00" },
      { empName: "Đỗ Quốc Bảo", startTime: "15:00", endTime: "23:00" },
      { empName: "Vũ Thị Phương", startTime: "10:00", endTime: "19:00" },
    ],
    "10/04": [
      { empName: "Nguyễn Văn An", startTime: "07:00", endTime: "13:00" },
      { empName: "Lê Minh Cường", startTime: "07:00", endTime: "12:00" },
      { empName: "Lê Minh Cường", startTime: "18:00", endTime: "23:00" }, // ca gãy
      { empName: "Phạm Thu Dung", startTime: "08:00", endTime: "12:00" },
      { empName: "Phạm Thu Dung", startTime: "17:00", endTime: "22:00" }, // ca gãy
      { empName: "Hoàng Đức Em", startTime: "07:00", endTime: "14:00" },
      { empName: "Đỗ Quốc Bảo", startTime: "09:00", endTime: "18:00" },
      { empName: "Ngô Thanh Tâm", startTime: "16:00", endTime: "23:00" },
    ],
    "11/04": [
      { empName: "Trần Thị Bình", startTime: "08:00", endTime: "13:00" },
      { empName: "Trần Thị Bình", startTime: "17:00", endTime: "22:00" }, // ca gãy
      { empName: "Hoàng Đức Em", startTime: "10:00", endTime: "20:00" },
      { empName: "Lê Minh Cường", startTime: "07:00", endTime: "14:00" },
    ],
    "12/04": [
      { empName: "Phạm Thu Dung", startTime: "09:00", endTime: "13:00" },
      { empName: "Phạm Thu Dung", startTime: "16:00", endTime: "20:00" }, // ca gãy
      { empName: "Ngô Thanh Tâm", startTime: "10:00", endTime: "18:00" },
      { empName: "Vũ Thị Phương", startTime: "12:00", endTime: "20:00" },
    ],
  };

  // Manager has already created some shifts for some days
  const preShifts: Record<string, ShiftBlock[]> = {
    "06/04": [
      {
        id: genId(),
        label: "07:00 - 12:00",
        startTime: "07:00",
        endTime: "12:00",
        maxSlots: 3,
        assignedEmployees: ["Nguyễn Văn An", "Trần Thị Bình", "Phạm Thu Dung"],
      },
      {
        id: genId(),
        label: "12:00 - 18:00",
        startTime: "12:00",
        endTime: "18:00",
        maxSlots: 3,
        assignedEmployees: ["Lê Minh Cường"],
      },
    ],
  };

  return nextWeekDates.map((date, i) => ({
    date,
    fullDate: date + "/2026",
    dayLabel: dayLabels[i],
    availabilities: avails[date] || [],
    shifts: preShifts[date] || [],
  }));
}

export default function Shifts() {
  const { user } = useEmployeeAuth();
  const isStaff = user?.role === "staff";
  const isManager = user?.role === "admin" || user?.role === "manager";
  const staffName = user?.name === "Tran Thi B" ? "Trần Thị Bình" : user?.name || "Trần Thị Bình";

  const [weekView, setWeekView] = useState<"current" | "next">("next");
  const [currentWeek] = useState(buildCurrentWeek);
  const [nextWeek, setNextWeek] = useState(buildNextWeek);
  const [activeTab, setActiveTab] = useState<"calendar" | "hours">("calendar");

  const [managerTab, setManagerTab] = useState<"availability" | "schedule">("availability");

  const [addAvailModal, setAddAvailModal] = useState<{ dayIdx: number } | null>(null);
  const [availStart, setAvailStart] = useState("07:00");
  const [availEnd, setAvailEnd] = useState("15:00");
  const [dateRegister, setDateRegister] = useState("");

  const [createShiftModal, setCreateShiftModal] = useState<{ dayIdx: number } | null>(null);
  const [shiftStart, setShiftStart] = useState("07:00");
  const [shiftEnd, setShiftEnd] = useState("13:00");
  const [shiftMax, setShiftMax] = useState(3);

  const [assignModal, setAssignModal] = useState<{ dayIdx: number; shiftId: string } | null>(null);

  const [editModal, setEditModal] = useState<{ dayIdx: number; shift: ShiftBlock } | null>(null);

  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editMax, setEditMax] = useState(3);

  const TODAY_DATE = "01/04";
  const [dayOpen, setDayOpen] = useState<{ openedAt: string; openedBy: string } | null>(null);
  const [dayClosed, setDayClosed] = useState(false);

  const [attendance, setAttendance] = useState<Record<string, { checkIn?: string; checkOut?: string }>>({});

  const [shiftList, setShiftList] = useState([]);
  const [shiftListNextWeek, setShiftListNextWeek] = useState([]);

  const nowTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const openDay = () => {
    setDayOpen({ openedAt: nowTimeStr(), openedBy: user?.name || "Manager" });
    setDayClosed(false);
  };

  const closeDay = () => {
    setDayClosed(true);
  };

  const checkIn = (shiftId: string, empName: string) => {
    const key = `${shiftId}__${empName}`;
    setAttendance(prev => ({ ...prev, [key]: { ...prev[key], checkIn: nowTimeStr() } }));
  };

  const checkOut = (shiftId: string, empName: string) => {
    const key = `${shiftId}__${empName}`;
    setAttendance(prev => ({ ...prev, [key]: { ...prev[key], checkOut: nowTimeStr() } }));
  };

  const weekLabel = weekView === "current" ? currentWeekLabel : nextWeekLabel;

  const fetchData = async () => {
    try {
      const targetEmployeeId = user?.employee_id;
      const res = await getShifts(
        {
          store_id: user?.store_id,
          employee_id: targetEmployeeId,
          from_date: getWeek("current")[0],
          to_date: getWeek("current")[6],
        },
        "",
      );
      const formattedShifts = res.reduce((acc, shift) => {
        const targetEmpBlock = shift.list_employee.find(emp => emp.employee_id._id === targetEmployeeId);
        if (targetEmpBlock) {
          acc.push({
            date: getLocalDateString(shift.date), // Sửa dòng này
            start_time: shift.start_time,
            end_time: shift.end_time,
            shift_status: shift.shift_status,
            employee_info: targetEmpBlock,
          });
        }
        return acc;
      }, [] as any[]);
      setShiftList(formattedShifts);
    } catch (error) {
      console.log(error);
    }
  };
  console.log({
    store_id: user?.store_id,
    employee_id: user?.employee_id,
    from_date: getWeek("next")[0],
    to_date: getWeek("next")[6],
  });
  const getShiftNextWeek = async () => {
    try {
      const targetEmployeeId = user?.employee_id;
      const res = await getShifts(
        {
          store_id: user?.store_id,
          employee_id: targetEmployeeId,
          from_date: getWeek("next")[0],
          to_date: getWeek("next")[6],
        },
        "",
      );

      const formattedShifts = res.reduce((acc, shift) => {
        const targetEmpBlock = shift.list_employee.find(emp => emp.employee_id._id === targetEmployeeId);
        if (targetEmpBlock) {
          acc.push({
            date: getLocalDateString(shift.date), // Sửa dòng này
            start_time: shift.start_time,
            end_time: shift.end_time,
            shift_status: shift.shift_status,
            employee_info: targetEmpBlock,
          });
        }
        return acc;
      }, [] as any[]);

      setShiftListNextWeek(formattedShifts);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
    getShiftNextWeek();
  }, []);
  console.log(shiftList);
  console.log(shiftListNextWeek);
  const handleAsignShift = async () => {
    try {
      const payload: RegisterShiftPayload = {
        employee_id: user?.employee_id,
        start_time: availStart,
        end_time: availEnd,
        date: dateRegister,
        station: user?.station,
        store_id: user?.store_id,
      };
      const res = await registerShift(payload, "");
      if (res) {
        toast.success("Đăng ký thành công");
      }
    } catch (error) {
      toast.error("Có lỗi khi đăng kí!");
    }
  };

  // ── Staff: add availability ──
  const addAvailability = (dayIdx: number) => {
    setNextWeek(prev =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        // Check overlap with existing registrations
        const myAvails = d.availabilities.filter(a => a.empName === staffName);
        const overlaps = myAvails.some(a => availStart < a.endTime && availEnd > a.startTime);
        if (overlaps) {
          return d;
        }
        return {
          ...d,
          availabilities: [...d.availabilities, { empName: staffName, startTime: availStart, endTime: availEnd }].sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          ),
        };
      }),
    );

    setAddAvailModal(null);
    setAvailStart("07:00");
    setAvailEnd("15:00");
  };

  // ── Staff: remove single availability ──
  const removeAvailability = (dayIdx: number, startTime?: string) => {
    setNextWeek(prev =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        if (startTime) {
          const idx = d.availabilities.findIndex(a => a.empName === staffName && a.startTime === startTime);
          if (idx === -1) return d;
          return { ...d, availabilities: d.availabilities.filter((_, j) => j !== idx) };
        }
        return { ...d, availabilities: d.availabilities.filter(a => a.empName !== staffName) };
      }),
    );
  };

  // ── Manager: create shift ──
  const createShift = (dayIdx: number) => {
    const label = `${shiftStart} - ${shiftEnd}`;
    setNextWeek(prev =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        const newShifts = [
          ...d.shifts,
          {
            id: genId(),
            label,
            startTime: shiftStart,
            endTime: shiftEnd,
            maxSlots: shiftMax,
            assignedEmployees: [],
          },
        ].sort((a, b) => a.startTime.localeCompare(b.startTime));
        return { ...d, shifts: newShifts };
      }),
    );

    setCreateShiftModal(null);
    setShiftStart("07:00");
    setShiftEnd("13:00");
    setShiftMax(3);
  };

  // ── Manager: assign employee to shift ──
  const assignEmployee = (dayIdx: number, shiftId: string, empName: string) => {
    setNextWeek(prev =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        return {
          ...d,
          shifts: d.shifts.map(s => {
            if (s.id !== shiftId) return s;
            if (s.assignedEmployees.includes(empName)) return s;
            if (s.assignedEmployees.length >= s.maxSlots) return s;
            return { ...s, assignedEmployees: [...s.assignedEmployees, empName] };
          }),
        };
      }),
    );
  };

  // ── Manager: unassign ──
  const unassignEmployee = (dayIdx: number, shiftId: string, empName: string) => {
    setNextWeek(prev =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        return {
          ...d,
          shifts: d.shifts.map(s =>
            s.id === shiftId ? { ...s, assignedEmployees: s.assignedEmployees.filter(e => e !== empName) } : s,
          ),
        };
      }),
    );
  };

  // ── Manager: delete shift ──
  const deleteShift = (dayIdx: number, shiftId: string) => {
    setNextWeek(prev => prev.map((d, i) => (i === dayIdx ? { ...d, shifts: d.shifts.filter(s => s.id !== shiftId) } : d)));
  };

  // ── Manager: save edit shift ──
  const saveEditShift = (dayIdx: number, shiftId: string) => {
    setNextWeek(prev =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        return {
          ...d,
          shifts: d.shifts
            .map(s =>
              s.id === shiftId
                ? { ...s, label: `${editStart} - ${editEnd}`, startTime: editStart, endTime: editEnd, maxSlots: editMax }
                : s,
            )
            .sort((a, b) => a.startTime.localeCompare(b.startTime)),
        };
      }),
    );

    setEditModal(null);
  };

  // ── Summaries ──
  const totalAvails = nextWeek.reduce((a, d) => a + d.availabilities.length, 0);
  const totalShifts = nextWeek.reduce((a, d) => a + d.shifts.length, 0);
  const totalAssigned = nextWeek.reduce((a, d) => a + d.shifts.reduce((b, s) => b + s.assignedEmployees.length, 0), 0);
  const unfilledSlots = nextWeek.reduce(
    (a, d) => a + d.shifts.reduce((b, s) => b + Math.max(s.maxSlots - s.assignedEmployees.length, 0), 0),
    0,
  );

  const myAvails = nextWeek.filter(d => d.availabilities.some(a => a.empName === staffName)).length;
  const myAssignedShifts = nextWeek.reduce((a, d) => a + d.shifts.filter(s => s.assignedEmployees.includes(staffName)).length, 0);
  const myAssignedHours = nextWeek.reduce(
    (a, d) =>
      a +
      d.shifts.reduce((b, s) => {
        if (!s.assignedEmployees.includes(staffName)) return b;
        return b + getHours(s.startTime, s.endTime);
      }, 0),
    0,
  );

  const myCurrentShifts = currentWeek.reduce(
    (a, d) => a + d.shifts.filter(s => s.assignedEmployees.includes(staffName)).length,
    0,
  );
  const myCurrentHours = currentWeek.reduce(
    (a, d) =>
      a +
      d.shifts.reduce((b, s) => {
        if (!s.assignedEmployees.includes(staffName)) return b;
        return b + getHours(s.startTime, s.endTime);
      }, 0),
    0,
  );

  // Employee hours for hours tab
  const employeeHoursData = employees.map(emp => {
    const hoursThisWeek = currentWeek.reduce(
      (a, d) =>
        a +
        d.shifts.reduce((b, s) => {
          if (!s.assignedEmployees.includes(emp.name)) return b;
          return b + getHours(s.startTime, s.endTime);
        }, 0),
      0,
    );
    const shiftsThisWeek = currentWeek.reduce(
      (a, d) => a + d.shifts.filter(s => s.assignedEmployees.includes(emp.name)).length,
      0,
    );
    return {
      ...emp,
      shiftsThisWeek,
      hoursThisWeek,
      hoursMonth: Math.round(hoursThisWeek * 4 * 10) / 10,
      shiftsMonth: shiftsThisWeek * 4,
    };
  });

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">{isStaff ? "Đăng ký lịch rảnh" : "Quản lý ca làm việc"}</h1>
          <p className="text-muted-foreground mt-1">
            {isStaff
              ? "Đăng ký khung giờ rảnh tuần tiếp theo để quản lý sắp lịch"
              : "Xem lịch rảnh nhân viên và sắp xếp ca làm việc"}
          </p>
        </div>
        {isManager && (
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${activeTab === "calendar" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Calendar size={16} /> Lịch ca
            </button>
            <button
              onClick={() => setActiveTab("hours")}
              className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${activeTab === "hours" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Timer size={16} /> Tổng giờ lao động
            </button>
          </div>
        )}
      </div>

      {activeTab === "calendar" ? (
        <>
          {/* ════════════ TODAY'S SHIFTS ════════════ */}
          {(() => {
            const today = currentWeek.find(d => d.date === TODAY_DATE);
            if (!today) return null;
            const visibleShifts = isStaff ? today.shifts.filter(s => s.assignedEmployees.includes(staffName)) : today.shifts;
            const totalEmps = today.shifts.reduce((a, s) => a + s.assignedEmployees.length, 0);
            const checkedInCount = today.shifts.reduce(
              (a, s) => a + s.assignedEmployees.filter(e => attendance[`${s.id}__${e}`]?.checkIn).length,
              0,
            );
            const checkedOutCount = today.shifts.reduce(
              (a, s) => a + s.assignedEmployees.filter(e => attendance[`${s.id}__${e}`]?.checkOut).length,
              0,
            );

            const dayStatus = dayClosed ? "closed" : dayOpen ? "open" : "pending";

            return (
              <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl border border-primary/20 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-foreground flex items-center gap-2">
                        Ca hôm nay
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {today.dayLabel} {today.fullDate}
                        </span>
                        {dayStatus === "open" && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Đang mở
                          </span>
                        )}
                        {dayStatus === "closed" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Đã đóng</span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dayOpen ? `Mở lúc ${dayOpen.openedAt} · ${dayOpen.openedBy} · ` : ""}
                        {today.shifts.length} ca · {totalEmps} NV · {checkedInCount} đã check-in · {checkedOutCount} đã check-out
                      </p>
                    </div>
                  </div>
                  {isManager && (
                    <div className="flex gap-2">
                      {dayStatus === "pending" && (
                        <button
                          onClick={openDay}
                          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 text-sm"
                        >
                          <Play size={16} /> Mở ca làm việc
                        </button>
                      )}
                      {dayStatus === "open" && (
                        <button
                          onClick={closeDay}
                          className="flex items-center gap-2 border border-border bg-card text-foreground px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm"
                        >
                          <PowerOff size={16} /> Đóng ca ngày
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {!dayOpen && !dayClosed && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center gap-2 text-xs text-amber-700">
                      <AlertCircle size={14} />
                      {isManager
                        ? 'Bấm "Mở ca làm việc" để bắt đầu ngày làm việc — nhân viên mới có thể check-in.'
                        : "Quản lý chưa mở ca làm việc cho hôm nay."}
                    </div>
                  )}

                  {visibleShifts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {isStaff ? "Hôm nay bạn không có ca làm" : "Hôm nay chưa có ca nào"}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {visibleShifts.map(shift => {
                        const c = shiftTimeColors(shift.startTime);
                        return (
                          <div key={shift.id} className={`rounded-xl border p-3 ${c.border} ${c.bg}`}>
                            <div className="flex items-center justify-between mb-2.5">
                              <p className={`text-sm flex items-center gap-1.5 ${c.text}`}>
                                <Clock size={13} /> {shift.startTime} - {shift.endTime}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {getHours(shift.startTime, shift.endTime)}h · {shift.assignedEmployees.length} NV
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {shift.assignedEmployees.map(name => {
                                const ec = getEmpColor(name);
                                const isMe = name === staffName;
                                const att = attendance[`${shift.id}__${name}`] || {};
                                const canAct = dayStatus === "open" && (isManager || isMe);

                                return (
                                  <div
                                    key={name}
                                    className={`flex items-center justify-between gap-2 rounded-lg bg-white/70 p-2 ${isMe ? "ring-1 ring-primary/30" : ""}`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${ec.bg} ${ec.text} shrink-0`}
                                      >
                                        {initials(name)}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs text-foreground truncate">
                                          {name.split(" ").slice(-2).join(" ")}
                                          {isMe && <span className="text-primary"> (bạn)</span>}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                          {att.checkIn ? `In: ${att.checkIn}` : "Chưa check-in"}
                                          {att.checkOut && ` · Out: ${att.checkOut}`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      {!att.checkIn && (
                                        <button
                                          onClick={() => checkIn(shift.id, name)}
                                          disabled={!canAct}
                                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                          <Play size={10} /> Check-in
                                        </button>
                                      )}
                                      {att.checkIn && !att.checkOut && (
                                        <button
                                          onClick={() => checkOut(shift.id, name)}
                                          disabled={!canAct}
                                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                          <PowerOff size={10} /> Check-out
                                        </button>
                                      )}
                                      {att.checkIn && att.checkOut && (
                                        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-green-100 text-green-700">
                                          <CheckCircle2 size={10} /> Hoàn tất
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Week toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
              <button
                onClick={() => setWeekView("current")}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${weekView === "current" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
              >
                Tuần hiện tại
              </button>
              <button
                onClick={() => setWeekView("next")}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${weekView === "next" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
              >
                Tuần tiếp theo
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2.5 rounded-xl border border-border">
              <Calendar size={16} className="text-primary" /> {weekLabel}
            </div>
            {/* Manager sub-tabs for next week */}
            {isManager && weekView === "next" && (
              <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
                <button
                  onClick={() => setManagerTab("availability")}
                  className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${managerTab === "availability" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Eye size={14} /> Lịch rảnh NV
                </button>
                <button
                  onClick={() => setManagerTab("schedule")}
                  className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${managerTab === "schedule" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Users size={14} /> Sắp lịch
                </button>
              </div>
            )}
          </div>

          {/* Summary cards */}
          {weekView === "next" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {isManager ? (
                <>
                  <SummaryCard label="NV đã đăng ký rảnh" value={`${totalAvails} lượt`} />
                  <SummaryCard label="Ca đã tạo" value={totalShifts.toString()} />
                  <SummaryCard label="Đã xếp NV" value={totalAssigned.toString()} valueColor="text-green-600" />
                  <SummaryCard
                    label="Slot còn trống"
                    value={unfilledSlots.toString()}
                    valueColor={unfilledSlots > 0 ? "text-amber-600" : "text-green-600"}
                  />
                </>
              ) : (
                <>
                  <SummaryCard label="Ngày đã ĐK rảnh" value={`${myAvails}/7`} valueColor="text-primary" />
                  <SummaryCard label="Ca được xếp (tuần tới)" value={myAssignedShifts.toString()} valueColor="text-green-600" />
                  <SummaryCard label="Ca tuần này" value={myCurrentShifts.toString()} />
                  <SummaryCard label="Giờ tuần này" value={myCurrentHours + "h"} />
                </>
              )}
            </div>
          )}

          {/* ════════════ STAFF VIEW ════════════ */}
          {isStaff && weekView === "next" && (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <Clock size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground">Đăng ký khung giờ rảnh</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chọn ngày và nhập giờ bạn có thể đi làm. Quản lý sẽ dựa vào đây để sắp lịch ca chính thức.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7 gap-3">
                {getWeek("next").map((day, dayIdx) => {
                  // Lấy danh sách khung giờ đã đăng ký từ biến shiftListNextWeek
                  const shiftsForDay = shiftListNextWeek.filter((s: any) => s.date === day);
                  // Tính tổng thời lượng đăng ký trong ngày
                  const totalAvailH = shiftsForDay.reduce((a: number, s: any) => a + getHours(s.start_time, s.end_time), 0);

                  return (
                    <div
                      key={day}
                      className={`bg-card rounded-2xl border overflow-hidden flex flex-col ${shiftsForDay.length > 0 ? "border-primary/30" : "border-border"}`}
                    >
                      <div
                        className={`px-3 py-2.5 border-b ${shiftsForDay.length > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-muted-foreground">{dayLabels[dayIdx]}</span>
                            <span className="ml-1.5 text-sm text-foreground">{day}</span>
                          </div>
                          {shiftsForDay.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              {shiftsForDay.length > 1 ? `${shiftsForDay.length} khung` : "Đã ĐK"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 flex flex-col flex-1 gap-2 min-h-[120px]">
                        {/* Hiển thị các khung giờ đã đăng ký */}
                        {shiftsForDay.length > 0 && (
                          <div className="space-y-1.5">
                            {shiftsForDay.map((s: any, si: number) => {
                              // Dùng hàm shiftTimeColors có sẵn để lấy màu sắc theo giờ
                              const sc = shiftTimeColors(s.start_time);
                              return (
                                <div key={si} className={`rounded-xl p-2.5 border ${sc.border} ${sc.bg}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span
                                      className={`text-[10px] font-medium uppercase tracking-wider ${sc.text} flex items-center gap-1`}
                                    >
                                      <Clock size={11} /> Đã đăng ký
                                    </span>
                                  </div>
                                  <p className={`text-sm font-semibold text-foreground`}>
                                    {s.start_time} - {s.end_time}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Thời lượng: {getHours(s.start_time, s.end_time)}h
                                  </p>
                                </div>
                              );
                            })}
                            {shiftsForDay.length > 1 && (
                              <p className="text-[11px] text-primary/80 font-medium text-center pt-1 border-t border-primary/10 mt-2">
                                Tổng thời gian: {totalAvailH}h
                              </p>
                            )}
                          </div>
                        )}

                        {/* Nút đăng ký thêm giờ (luôn hiển thị ở dưới cùng) */}
                        <button
                          onClick={() => {
                            setAvailStart("07:00");
                            setAvailEnd("15:00");
                            setAddAvailModal({ dayIdx });
                            setDateRegister(nextWeekDates[dayIdx]);
                          }}
                          className={`w-full mt-auto rounded-xl border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary transition-all flex flex-col items-center justify-center gap-1.5 ${shiftsForDay.length > 0 ? "py-2.5 bg-background" : "py-6 bg-muted/10 hover:bg-primary/5"}`}
                        >
                          <Plus size={16} />
                          <span className="text-xs font-medium">
                            {shiftsForDay.length > 0 ? "Thêm khung giờ" : "Đăng ký giờ rảnh"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Staff: summary of assigned shifts */}
              {myAssignedShifts > 0 && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" /> Ca được xếp tuần tới ({myAssignedShifts} ca ·{" "}
                    {myAssignedHours}h)
                  </h3>
                  <div className="space-y-2">
                    {nextWeek.map(day =>
                      day.shifts
                        .filter(s => s.assignedEmployees.includes(staffName))
                        .map(s => {
                          const c = shiftTimeColors(s.startTime);
                          return (
                            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg} ${c.text}`}>
                                  <Clock size={16} />
                                </div>
                                <div>
                                  <p className="text-sm text-foreground">
                                    {day.dayLabel} {day.date} — {s.startTime} - {s.endTime}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{getHours(s.startTime, s.endTime)}h</p>
                                </div>
                              </div>
                              <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">Đã xếp</span>
                            </div>
                          );
                        }),
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {isStaff &&
            weekView === "current" &&
            (() => {
              const weekTotal = currentWeek.reduce(
                (a, d) =>
                  a +
                  d.shifts.reduce(
                    (b, s) => (s.assignedEmployees.includes(staffName) ? b + getHours(s.startTime, s.endTime) : b),
                    0,
                  ),
                0,
              );
              return (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-foreground flex items-center gap-2">
                      <Calendar size={16} className="text-primary" /> Lịch ca của tôi — {currentWeekLabel}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Tổng: {weekTotal}h</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-0 divide-x divide-border/50">
                    {getWeek("current").map((day, index) => {
                      const isToday = day === getToday();
                      const shiftsForDay = shiftList.filter(s => s.date === day);

                      const dayH = shiftsForDay.reduce((a, s) => a + getHours(s.start_time, s.end_time), 0);
                      return (
                        <div key={day} className={`p-3 ${isToday ? "bg-primary/[0.03]" : ""}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-xs text-muted-foreground">{dayLabels[index]}</span>
                              <span className="ml-1 text-sm text-foreground">{day}</span>
                              {isToday && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-primary text-white">Nay</span>}
                            </div>
                            {dayH > 0 && <span className="text-[10px] text-muted-foreground">{dayH}h</span>}
                          </div>
                          {shiftsForDay.length > 0 ? (
                            <div className="space-y-1.5">
                              {shiftsForDay.map((s, si) => {
                                const sc = shiftTimeColors(s.start_time);
                                return (
                                  <div key={si} className={`rounded-lg p-2 border ${sc.border} ${sc.bg}`}>
                                    <p className={`text-xs ${sc.text} flex items-center gap-1`}>
                                      <Clock size={10} /> {s.start_time} - {s.end_time}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{getHours(s.start_time, s.end_time)}h</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground/40 italic text-center py-3">Nghỉ</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {/* ════════════ MANAGER: Current week Gantt timeline ════════════ */}
          {isManager &&
            weekView === "current" &&
            (() => {
              // Build per-employee, per-day shift blocks (keep split shifts separate)
              const allEmpNames = new Set<string>();
              currentWeek.forEach(day => day.shifts.forEach(s => s.assignedEmployees.forEach(n => allEmpNames.add(n))));
              const empList = employees.filter(e => allEmpNames.has(e.name));

              return (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-foreground flex items-center gap-2">
                      <Calendar size={16} className="text-primary" /> Lịch ca tuần hiện tại — {currentWeekLabel}
                    </h3>
                    <span className="text-xs text-muted-foreground">{empList.length} nhân viên</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={{ minWidth: 900 }}>
                      <thead>
                        <tr className="bg-muted/50 text-muted-foreground">
                          <th className="px-3 py-2.5 text-left sticky left-0 bg-muted/50 z-10 min-w-[120px]">Nhân viên</th>
                          {currentWeek.map(d => {
                            const isToday = d.date === "01/04";
                            return (
                              <th
                                key={d.date}
                                className={`px-1 py-2.5 text-center min-w-[140px] ${isToday ? "bg-primary/5" : ""}`}
                              >
                                <span className="text-xs">{d.dayLabel}</span>
                                <span className="ml-1 text-foreground text-xs">{d.date}</span>
                                {isToday && (
                                  <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-primary text-white">Nay</span>
                                )}
                              </th>
                            );
                          })}
                          <th className="px-3 py-2.5 text-center min-w-[60px]">Tổng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empList.map(emp => {
                          const ec = getEmpColor(emp.name);
                          const weekTotal = currentWeek.reduce(
                            (a, d) =>
                              a +
                              d.shifts.reduce(
                                (b, s) => (s.assignedEmployees.includes(emp.name) ? b + getHours(s.startTime, s.endTime) : b),
                                0,
                              ),
                            0,
                          );
                          return (
                            <tr key={emp.name} className="border-t border-border/50 hover:bg-muted/20">
                              <td className="px-3 py-2 sticky left-0 bg-card z-10">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] ${ec.bg} ${ec.text}`}
                                  >
                                    {initials(emp.name)}
                                  </div>
                                  <div>
                                    <p className="text-xs text-foreground whitespace-nowrap">
                                      {emp.name.split(" ").slice(-2).join(" ")}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{emp.type === "fulltime" ? "FT" : "PT"}</p>
                                  </div>
                                </div>
                              </td>
                              {currentWeek.map(day => {
                                const isToday = day.date === "01/04";
                                const myShifts = day.shifts.filter(s => s.assignedEmployees.includes(emp.name));
                                const isSplit = myShifts.length >= 2;
                                const dayH = myShifts.reduce((a, s) => a + getHours(s.startTime, s.endTime), 0);
                                return (
                                  <td key={day.date} className={`px-1 py-1.5 ${isToday ? "bg-primary/[0.02]" : ""}`}>
                                    {myShifts.length > 0 ? (
                                      <div>
                                        {/* Gantt bar */}
                                        <div className="relative h-7">
                                          <div className="absolute inset-0 rounded bg-muted/30" />
                                          {myShifts.map((s, si) => {
                                            const left = timeToPercent(s.startTime);
                                            const width = timeToPercent(s.endTime) - left;
                                            const sc = shiftTimeColors(s.startTime);
                                            const hrs = getHours(s.startTime, s.endTime);
                                            return (
                                              <div
                                                key={si}
                                                className={`absolute top-0.5 bottom-0.5 rounded ${sc.bar} cursor-default group/bar`}
                                                style={{ left: `${left}%`, width: `${Math.max(width, 3)}%` }}
                                                title={`${s.startTime} - ${s.endTime} (${hrs}h)`}
                                              >
                                                {width > 15 && (
                                                  <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white drop-shadow-sm">
                                                    {s.startTime}-{s.endTime}
                                                  </span>
                                                )}
                                                <div className="hidden group-hover/bar:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-foreground text-background text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                                                  {s.startTime} - {s.endTime} · {hrs}h
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        {/* Info line below bar */}
                                        <div className="flex items-center justify-center gap-1 mt-0.5">
                                          {isSplit && (
                                            <span className="text-[8px] px-1 py-px rounded bg-amber-100 text-amber-700">
                                              ca gãy
                                            </span>
                                          )}
                                          <span className="text-[9px] text-muted-foreground">{dayH}h</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-10 flex items-center justify-center">
                                        <span className="text-[10px] text-muted-foreground/30">—</span>
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-center">
                                <span className={`text-xs ${weekTotal > 40 ? "text-red-500" : "text-foreground"}`}>
                                  {weekTotal}h
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Footer: total employees per day */}
                      <tfoot>
                        <tr className="border-t border-border bg-muted/30">
                          <td className="px-3 py-2.5 sticky left-0 bg-muted/30 z-10 text-xs text-muted-foreground">
                            Tổng NV/ngày
                          </td>
                          {currentWeek.map(day => {
                            const count = new Set(day.shifts.flatMap(s => s.assignedEmployees)).size;
                            return (
                              <td key={day.date} className="px-1 py-2.5 text-center text-xs text-foreground">
                                {count}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-center text-xs text-primary">
                            {Math.round(
                              empList.reduce(
                                (a, emp) =>
                                  a +
                                  currentWeek.reduce(
                                    (b, d) =>
                                      b +
                                      d.shifts.reduce(
                                        (c, s) =>
                                          s.assignedEmployees.includes(emp.name) ? c + getHours(s.startTime, s.endTime) : c,
                                        0,
                                      ),
                                    0,
                                  ),
                                0,
                              ),
                            )}
                            h
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {/* Timeline legend */}
                  <div className="px-4 py-2 border-t border-border bg-muted/20">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      <span className="text-[9px] text-muted-foreground shrink-0">Trục giờ:</span>
                      {timelineMarkers
                        .filter((_, i) => i % 2 === 0)
                        .map(h => (
                          <span key={h} className="text-[9px] text-muted-foreground/60 shrink-0">
                            {h}:00
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* ════════════ MANAGER: Next week - Availability view ════════════ */}
          {isManager && weekView === "next" && managerTab === "availability" && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-foreground flex items-center gap-2">
                    <Users size={16} className="text-primary" /> Lịch rảnh nhân viên đăng ký — Tuần {nextWeekLabel}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nhân viên tự đăng ký giờ rảnh. Dựa vào đây để sắp ca ở tab "Sắp lịch".
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-left">
                        <th className="px-4 py-3 sticky left-0 bg-muted/50 z-10 min-w-[140px]">Nhân viên</th>
                        {nextWeek.map(d => (
                          <th key={d.date} className="px-3 py-3 text-center min-w-[100px]">
                            <span className="text-xs">{d.dayLabel}</span>
                            <br />
                            <span className="text-foreground">{d.date}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => {
                        const ec = getEmpColor(emp.name);
                        return (
                          <tr key={emp.name} className="border-t border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-3 sticky left-0 bg-card z-10">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${ec.bg} ${ec.text}`}
                                >
                                  {initials(emp.name)}
                                </div>
                                <div>
                                  <p className="text-xs text-foreground whitespace-nowrap">
                                    {emp.name.split(" ").slice(-2).join(" ")}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">{emp.type === "fulltime" ? "FT" : "PT"}</p>
                                </div>
                              </div>
                            </td>
                            {nextWeek.map(day => {
                              const avails = day.availabilities.filter(a => a.empName === emp.name);
                              return (
                                <td key={day.date} className="px-2 py-2 text-center">
                                  {avails.length > 0 ? (
                                    <div className="space-y-1">
                                      {avails.map((avail, ai) => (
                                        <div key={ai} className={`rounded-lg px-2 py-1 border ${ec.border} ${ec.bg}`}>
                                          <p className={`text-[11px] ${ec.text}`}>
                                            {avail.startTime}-{avail.endTime}
                                          </p>
                                          <p className="text-[9px] text-muted-foreground">
                                            {getHours(avail.startTime, avail.endTime)}h
                                          </p>
                                        </div>
                                      ))}
                                      {avails.length >= 2 && <p className="text-[8px] text-amber-600">ca gãy</p>}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/30">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ MANAGER: Next week - Schedule view ════════════ */}
          {isManager && weekView === "next" && managerTab === "schedule" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
              {nextWeek.map((day, dayIdx) => (
                <div key={day.date} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">{day.dayLabel}</span>
                      <span className="ml-1.5 text-sm text-foreground">{day.date}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShiftStart("07:00");
                        setShiftEnd("13:00");
                        setShiftMax(3);
                        setCreateShiftModal({ dayIdx });
                      }}
                      className="p-1 rounded-lg hover:bg-primary/10 text-primary"
                      title="Thêm ca"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="p-2 space-y-2 min-h-[120px]">
                    {day.shifts.length === 0 && (
                      <button
                        onClick={() => {
                          setShiftStart("07:00");
                          setShiftEnd("13:00");
                          setShiftMax(3);
                          setCreateShiftModal({ dayIdx });
                        }}
                        className="w-full py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/30 text-muted-foreground hover:text-primary transition-colors flex flex-col items-center gap-1"
                      >
                        <Plus size={18} />
                        <span className="text-xs">Tạo ca làm</span>
                      </button>
                    )}

                    {day.shifts.map(shift => {
                      const c = shiftTimeColors(shift.startTime);
                      const isFull = shift.assignedEmployees.length >= shift.maxSlots;
                      // Find available employees for this shift
                      const availableForShift = day.availabilities.filter(
                        a =>
                          a.startTime <= shift.startTime &&
                          a.endTime >= shift.endTime &&
                          !shift.assignedEmployees.includes(a.empName),
                      );

                      return (
                        <div key={shift.id} className={`rounded-xl border p-2.5 ${c.border} ${c.bg}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs ${c.text} flex items-center gap-1`}>
                              <Clock size={10} /> {shift.startTime} - {shift.endTime}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => {
                                  setEditStart(shift.startTime);
                                  setEditEnd(shift.endTime);
                                  setEditMax(shift.maxSlots);
                                  setEditModal({ dayIdx, shift });
                                }}
                                className="p-0.5 rounded hover:bg-white/60 text-muted-foreground hover:text-primary"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                onClick={() => deleteShift(dayIdx, shift.id)}
                                className="p-0.5 rounded hover:bg-white/60 text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                            <span>{getHours(shift.startTime, shift.endTime)}h</span>
                            <span className={isFull ? "text-red-500" : ""}>
                              {shift.assignedEmployees.length}/{shift.maxSlots}
                            </span>
                          </div>

                          {/* Assigned employees */}
                          <div className="space-y-1 mb-1.5">
                            {shift.assignedEmployees.map(name => {
                              const ec = getEmpColor(name);
                              return (
                                <div
                                  key={name}
                                  className="flex items-center justify-between rounded-md bg-white/60 px-1.5 py-0.5"
                                >
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] ${ec.bg} ${ec.text}`}
                                    >
                                      {initials(name)}
                                    </div>
                                    <span className="text-[10px] text-foreground truncate">
                                      {name.split(" ").slice(-2).join(" ")}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => unassignEmployee(dayIdx, shift.id, name)}
                                    className="text-muted-foreground hover:text-red-500 p-0.5"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Quick assign: show available employees */}
                          {!isFull && availableForShift.length > 0 && (
                            <div className="border-t border-border/30 pt-1.5 mt-1">
                              <p className="text-[9px] text-muted-foreground mb-1">NV rảnh khung giờ này:</p>
                              <div className="flex flex-wrap gap-1">
                                {availableForShift.map(a => {
                                  const ec = getEmpColor(a.empName);
                                  return (
                                    <button
                                      key={a.empName}
                                      onClick={() => assignEmployee(dayIdx, shift.id, a.empName)}
                                      className={`text-[9px] px-1.5 py-0.5 rounded-md border ${ec.border} ${ec.bg} ${ec.text} hover:shadow-sm transition-shadow`}
                                      title={`${a.empName} (rảnh ${a.startTime}-${a.endTime})`}
                                    >
                                      + {a.empName.split(" ").slice(-1)[0]}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Manual assign button */}
                          {!isFull && (
                            <button
                              onClick={() => setAssignModal({ dayIdx, shiftId: shift.id })}
                              className="w-full text-[9px] text-muted-foreground hover:text-primary bg-white/40 hover:bg-white/70 rounded-md py-0.5 mt-1 transition-colors"
                            >
                              + Xếp NV khác
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Day availability preview */}
                  {day.availabilities.length > 0 && (
                    <div className="px-2 pb-2">
                      <p className="text-[9px] text-muted-foreground mb-1 px-1">Rảnh ngày này ({day.availabilities.length}):</p>
                      <div className="flex flex-wrap gap-1">
                        {day.availabilities.map((a, ai) => {
                          const ec = getEmpColor(a.empName);
                          return (
                            <span
                              key={`${a.empName}-${ai}`}
                              className={`text-[8px] px-1 py-0.5 rounded ${ec.bg} ${ec.text}`}
                              title={`${a.empName}: ${a.startTime}-${a.endTime}`}
                            >
                              {a.empName.split(" ").slice(-1)[0]} {a.startTime}-{a.endTime}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ── Working Hours Tab ── */
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-foreground">Tổng giờ lao động — Tuần {currentWeekLabel}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <th className="px-5 py-3">Nhân viên</th>
                  <th className="px-5 py-3">Loại</th>
                  <th className="px-5 py-3 text-center">Ca tuần</th>
                  <th className="px-5 py-3 text-center">Giờ tuần</th>
                  <th className="px-5 py-3 text-center">Ước tính tháng</th>
                  <th className="px-5 py-3 text-right">Lương dự kiến</th>
                </tr>
              </thead>
              <tbody>
                {employeeHoursData.map(emp => {
                  const salary = emp.type === "parttime" ? emp.hourlyRate * emp.hoursMonth : 0;
                  return (
                    <tr key={emp.name} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                            {initials(emp.name)}
                          </div>
                          <span className="text-foreground">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-1 rounded text-[11px] ${emp.type === "fulltime" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                        >
                          {emp.type === "fulltime" ? "Full-time" : "Part-time"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-foreground">{emp.shiftsThisWeek}</td>
                      <td className="px-5 py-4 text-center text-foreground">{emp.hoursThisWeek}h</td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-foreground">{emp.hoursMonth}h</span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min((emp.hoursMonth / 176) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {emp.type === "parttime" ? (
                          <div>
                            <p className="text-primary">{formatVND(salary)}</p>
                            <p className="text-[11px] text-muted-foreground">{formatVND(emp.hourlyRate)}/h</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Lương cố định</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-5 border-t border-border bg-muted/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tổng ca tuần</p>
                <p className="text-foreground text-lg">{employeeHoursData.reduce((a, e) => a + e.shiftsThisWeek, 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng giờ tuần</p>
                <p className="text-foreground text-lg">{employeeHoursData.reduce((a, e) => a + e.hoursThisWeek, 0)}h</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">TB giờ/NV</p>
                <p className="text-foreground text-lg">
                  {Math.round(
                    employeeHoursData.reduce((a, e) => a + e.hoursThisWeek, 0) /
                      Math.max(employeeHoursData.filter(e => e.hoursThisWeek > 0).length, 1),
                  )}
                  h
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lương PT dự kiến</p>
                <p className="text-primary text-lg">
                  {formatVND(
                    employeeHoursData.filter(e => e.type === "parttime").reduce((a, e) => a + e.hourlyRate * e.hoursMonth, 0),
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thêm khung giwof */}
      {addAvailModal &&
        (() => {
          const day = nextWeekDates[addAvailModal.dayIdx];
          const date = dayLabels[addAvailModal.dayIdx];

          return (
            <Modal onClose={() => setAddAvailModal(null)}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-foreground">
                  Đăng ký giờ rảnh — {date} {day}
                </h3>
                <button onClick={() => setAddAvailModal(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">Nhập khung giờ bạn có thể đi làm trong ngày này:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-foreground mb-1.5">Từ</label>
                    <input
                      type="time"
                      value={availStart}
                      onChange={e => setAvailStart(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground mb-1.5">Đến</label>
                    <input
                      type="time"
                      value={availEnd}
                      onChange={e => setAvailEnd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                </div>
                {availStart && availEnd && availEnd > availStart && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl flex items-center gap-2">
                    <Timer size={12} className="text-primary" />
                    Rảnh <span className="text-foreground">{getHours(availStart, availEnd)}h</span> trong ngày
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setAddAvailModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      addAvailability(addAvailModal.dayIdx);
                      handleAsignShift();
                    }}
                    disabled={!availStart || !availEnd || availEnd <= availStart}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={14} /> Xác nhận
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}

      {/* ── Create Shift Modal (Manager) ── */}
      {createShiftModal &&
        isManager &&
        (() => {
          const day = nextWeek[createShiftModal.dayIdx];
          return (
            <Modal onClose={() => setCreateShiftModal(null)}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-foreground">
                  Tạo ca — {day.dayLabel} {day.fullDate}
                </h3>
                <button onClick={() => setCreateShiftModal(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-foreground mb-1.5">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={shiftStart}
                      onChange={e => setShiftStart(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground mb-1.5">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={shiftEnd}
                      onChange={e => setShiftEnd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">Số NV tối đa</label>
                  <input
                    type="number"
                    value={shiftMax}
                    onChange={e => setShiftMax(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm"
                  />
                </div>
                {/* Show who's available */}
                {shiftStart && shiftEnd && shiftEnd > shiftStart && (
                  <>
                    <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl flex items-center gap-2">
                      <Timer size={12} className="text-primary" /> Thời lượng:{" "}
                      <span className="text-foreground">{getHours(shiftStart, shiftEnd)}h</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">NV rảnh khung giờ này:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {day.availabilities
                          .filter(a => a.startTime <= shiftStart && a.endTime >= shiftEnd)
                          .map((a, ai) => {
                            const ec = getEmpColor(a.empName);
                            return (
                              <span key={`${a.empName}-${ai}`} className={`text-xs px-2 py-1 rounded-lg ${ec.bg} ${ec.text}`}>
                                {a.empName.split(" ").slice(-2).join(" ")} ({a.startTime}-{a.endTime})
                              </span>
                            );
                          })}
                        {day.availabilities.filter(a => a.startTime <= shiftStart && a.endTime >= shiftEnd).length === 0 && (
                          <span className="text-xs text-muted-foreground italic">Không có NV nào rảnh ��ủ khung giờ</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setCreateShiftModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => createShift(createShiftModal.dayIdx)}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Tạo ca
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}

      {/* ── Assign Employee Modal ── */}
      {assignModal &&
        isManager &&
        (() => {
          const { dayIdx, shiftId } = assignModal;
          const day = nextWeek[dayIdx];
          const shift = day.shifts.find(s => s.id === shiftId);
          if (!shift) return null;
          const allEmps = employees.filter(e => !shift.assignedEmployees.includes(e.name));

          return (
            <Modal onClose={() => setAssignModal(null)}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {day.dayLabel} {day.fullDate}
                  </p>
                  <h3 className="text-foreground mt-0.5">
                    Xếp NV — {shift.startTime} - {shift.endTime}
                  </h3>
                </div>
                <button onClick={() => setAssignModal(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                {shift.assignedEmployees.length >= shift.maxSlots && (
                  <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl text-center">Đã đủ {shift.maxSlots} chỗ</div>
                )}
                {allEmps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tất cả NV đã được xếp</p>
                ) : (
                  allEmps.map(emp => {
                    const ec = getEmpColor(emp.name);
                    const avails = day.availabilities.filter(a => a.empName === emp.name);
                    const isAvail = avails.some(a => a.startTime <= shift.startTime && a.endTime >= shift.endTime);
                    return (
                      <div
                        key={emp.name}
                        className={`flex items-center justify-between p-3 rounded-xl border ${isAvail ? "border-green-200 bg-green-50/30" : "border-border"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${ec.bg} ${ec.text}`}>
                            {initials(emp.name)}
                          </div>
                          <div>
                            <p className="text-sm text-foreground">{emp.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {emp.type === "fulltime" ? "Full-time" : "Part-time"}
                              {avails.length > 0
                                ? ` · Rảnh ${avails.map(a => `${a.startTime}-${a.endTime}`).join(", ")}`
                                : " · Chưa đăng ký rảnh"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAvail && (
                            <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Phù hợp</span>
                          )}
                          <button
                            onClick={() => {
                              assignEmployee(dayIdx, shiftId, emp.name);
                            }}
                            disabled={shift.assignedEmployees.length >= shift.maxSlots}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus size={12} /> Xếp
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Modal>
          );
        })()}

      {/* ── Edit Shift Modal ── */}
      {editModal &&
        isManager &&
        (() => {
          const { dayIdx, shift } = editModal;
          const day = nextWeek[dayIdx];
          return (
            <Modal onClose={() => setEditModal(null)}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-foreground">
                  Sửa ca — {day.dayLabel} {day.fullDate}
                </h3>
                <button onClick={() => setEditModal(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-foreground mb-1.5">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={editStart}
                      onChange={e => setEditStart(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground mb-1.5">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={editEnd}
                      onChange={e => setEditEnd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">Số NV tối đa</label>
                  <input
                    type="number"
                    value={editMax}
                    onChange={e => setEditMax(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm"
                  />
                </div>
                {editStart && editEnd && editEnd > editStart && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl flex items-center gap-2">
                    <Timer size={12} className="text-primary" /> Thời lượng:{" "}
                    <span className="text-foreground">{getHours(editStart, editEnd)}h</span>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setEditModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => saveEditShift(dayIdx, shift.id)}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> Lưu
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
}

// ── Shared Components ──
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl mt-1 ${valueColor || "text-foreground"}`}>{value}</p>
    </div>
  );
}
