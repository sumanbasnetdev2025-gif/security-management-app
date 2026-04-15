'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatDateTime, calcDuration } from '@/lib/utils'
import { Download, Loader2, FileSpreadsheet, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
const [selectedGuard, setSelectedGuard] = useState('')
const [guards, setGuards] = useState<{ id: string; name: string }[]>([])

useEffect(() => {
  async function loadGuards() {
    const supabase = createClient()
    const { data } = await supabase
      .from('guards')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
    setGuards(data ?? [])
  }
  loadGuards()
}, [])
  async function exportParkingExcel() {
    setLoading('parking-excel')
    const supabase = createClient()
    const { data } = await supabase
      .from('parking_records')
      .select('*')
      .gte('entry_time', startDate + 'T00:00:00')
      .lte('entry_time', endDate + 'T23:59:59')
      .order('entry_time', { ascending: false })

    if (!data || data.length === 0) {
      toast.error('No parking records in selected range')
      setLoading(null)
      return
    }

    const { utils, writeFile } = await import('xlsx')
    const rows = data.map(r => ({
      'Plate Number': r.plate_number,
      'Vehicle Model': r.vehicle_model ?? '',
      'Color': r.color ?? '',
      'Parking Slot': r.parking_slot ?? '',
      'Entry Time': formatDateTime(r.entry_time),
      'Exit Time': r.exit_time ? formatDateTime(r.exit_time) : 'Still Parked',
      'Duration': calcDuration(r.entry_time, r.exit_time),
      'Remarks': r.remarks ?? '',
    }))

    const ws = utils.json_to_sheet(rows)
    const wb = utils.book_new()

    ws['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 20 }]

    utils.book_append_sheet(wb, ws, 'Parking Report')
    writeFile(wb, `Parking_Report_${startDate}_to_${endDate}.xlsx`)
    toast.success('Parking Excel downloaded')
    setLoading(null)
  }

  async function exportParkingPDF() {
    setLoading('parking-pdf')
    const supabase = createClient()
    const { data } = await supabase
      .from('parking_records')
      .select('*')
      .gte('entry_time', startDate + 'T00:00:00')
      .lte('entry_time', endDate + 'T23:59:59')
      .order('entry_time', { ascending: false })

    if (!data || data.length === 0) {
      toast.error('No parking records in selected range')
      setLoading(null)
      return
    }

    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('PARKING REPORT', 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Period: ${formatDate(startDate)} — ${formatDate(endDate)}`, 14, 26)
    doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 14, 32)
    doc.text(`Total Records: ${data.length}`, 14, 38)

    autoTable(doc, {
      startY: 44,
      head: [['Plate No.', 'Vehicle', 'Color', 'Slot', 'Entry Time', 'Exit Time', 'Duration']],
      body: data.map(r => [
        r.plate_number,
        r.vehicle_model ?? '—',
        r.color ?? '—',
        r.parking_slot ?? '—',
        formatDateTime(r.entry_time),
        r.exit_time ? formatDateTime(r.exit_time) : 'Still Parked',
        calcDuration(r.entry_time, r.exit_time),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    })

    doc.save(`Parking_Report_${startDate}_to_${endDate}.pdf`)
    toast.success('Parking PDF downloaded')
    setLoading(null)
  }

  async function exportAttendanceExcel() {
  setLoading('attendance-excel')
  const supabase = createClient()

  let query = supabase
    .from('attendance')
    .select('*, guards(name, id_number)')
    .gte('date', startDate)
    .lte('date', endDate)

  // ✅ ADDED FILTER
  if (selectedGuard) {
    query = query.eq('guard_id', selectedGuard)
  }

  const { data } = await query.order('date')

  if (!data || data.length === 0) {
    toast.error('No attendance records in selected range')
    setLoading(null)
    return
  }

  const { utils, writeFile } = await import('xlsx')

  const rows = data.map(r => ({
    'Date': r.date,
    'Guard Name': (r.guards as any)?.name ?? '',
    'ID Number': (r.guards as any)?.id_number ?? '',
    'Status': r.status.replace('_', ' ').toUpperCase(),
    'Shift': r.shift ? r.shift.toUpperCase() : '',
    'Location': r.location ?? '',
    'Remarks': r.remarks ?? '',
  }))

  const ws = utils.json_to_sheet(rows)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Attendance')

  writeFile(wb, `Attendance_Report_${startDate}_to_${endDate}.xlsx`)
  toast.success('Attendance Excel downloaded')
  setLoading(null)
}
  async function exportAttendancePDF() {
  setLoading('attendance-pdf')
  const supabase = createClient()

  let query = supabase
    .from('attendance')
    .select('*, guards(name, id_number)')
    .gte('date', startDate)
    .lte('date', endDate)

  if (selectedGuard) {
    query = query.eq('guard_id', selectedGuard)
  }

  const { data } = await query.order('date')

  if (!data || data.length === 0) {
    toast.error('No attendance records in selected range')
    setLoading(null)
    return
  }

  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()

  // ✅ ADDED HEADING BLOCK
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('GUARD ATTENDANCE REPORT', 14, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Period: ${formatDate(startDate)} — ${formatDate(endDate)}`, 14, 26)
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 14, 32)
  doc.text(`Total Records: ${data.length}`, 14, 38)

  autoTable(doc, {
    startY: 44, // ✅ PUSH TABLE DOWN to make room for heading
    head: [['Date', 'Guard Name', 'ID Number', 'Status', 'Shift', 'Location', 'Remarks']],
    body: data.map(r => [
      r.date,
      (r.guards as any)?.name ?? '—',
      (r.guards as any)?.id_number ?? '—',
      r.status.replace('_', ' ').toUpperCase(),
      r.shift ? r.shift.toUpperCase() : '—',
      r.location ?? '—',
      r.remarks ?? '—',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' }, // ✅ blue header
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })

  doc.save(`Attendance_Report_${startDate}_to_${endDate}.pdf`)
  toast.success('Attendance PDF downloaded')
  setLoading(null)
}
  async function exportIncidentsExcel() {
    setLoading('incidents-excel')
    const supabase = createClient()
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .gte('incident_datetime', startDate + 'T00:00:00')
      .lte('incident_datetime', endDate + 'T23:59:59')
      .order('incident_datetime', { ascending: false })

    if (!data || data.length === 0) {
      toast.error('No incidents in selected range')
      setLoading(null)
      return
    }

    const { utils, writeFile } = await import('xlsx')
    const rows = data.map(r => ({
      'Type': r.incident_type,
      'Location': r.location,
      'Date & Time': formatDateTime(r.incident_datetime),
      'Description': r.description,
      'Action Taken': r.action_taken ?? '',
    }))

    const ws = utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 40 }, { wch: 30 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Incidents')
    writeFile(wb, `Incidents_Report_${startDate}_to_${endDate}.xlsx`)
    toast.success('Incidents Excel downloaded')
    setLoading(null)
  }

  async function exportIncidentsPDF() {
    setLoading('incidents-pdf')
    const supabase = createClient()
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .gte('incident_datetime', startDate + 'T00:00:00')
      .lte('incident_datetime', endDate + 'T23:59:59')
      .order('incident_datetime', { ascending: false })

    if (!data || data.length === 0) {
      toast.error('No incidents in selected range')
      setLoading(null)
      return
    }

    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('INCIDENT REPORT', 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Period: ${formatDate(startDate)} — ${formatDate(endDate)}`, 14, 26)
    doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 14, 32)
    doc.text(`Total Incidents: ${data.length}`, 14, 38)

    autoTable(doc, {
      startY: 44,
      head: [['Type', 'Location', 'Date & Time', 'Description', 'Action Taken']],
      body: data.map(r => [
        r.incident_type,
        r.location,
        formatDateTime(r.incident_datetime),
        r.description,
        r.action_taken ?? '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 3: { cellWidth: 70 }, 4: { cellWidth: 60 } },
    })

    doc.save(`Incidents_Report_${startDate}_to_${endDate}.pdf`)
    toast.success('Incidents PDF downloaded')
    setLoading(null)
  }

  async function exportCCTVExcel() {
    setLoading('cctv-excel')
    const supabase = createClient()
    const { data } = await supabase.from('cctv_cameras').select('*').order('camera_name')

    if (!data || data.length === 0) {
      toast.error('No camera data')
      setLoading(null)
      return
    }

    const { utils, writeFile } = await import('xlsx')
    const rows = data.map(r => ({
      'Camera ID': r.camera_name,
      'Location': r.location,
      'Status': r.status.replace('_', ' ').toUpperCase(),
      'Last Checked': r.last_checked ? formatDateTime(r.last_checked) : '',
      'Technician': r.technician_name ?? '',
      'Notes': r.notes ?? '',
    }))

    const ws = utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 30 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'CCTV Audit')
    writeFile(wb, `CCTV_Audit_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    toast.success('CCTV Excel downloaded')
    setLoading(null)
  }

  async function exportCCTVPDF() {
    setLoading('cctv-pdf')
    const supabase = createClient()
    const { data } = await supabase.from('cctv_cameras').select('*').order('camera_name')

    if (!data || data.length === 0) {
      toast.error('No camera data')
      setLoading(null)
      return
    }

    const working = data.filter(c => c.status === 'working').length
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('CCTV AUDIT REPORT', 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 14, 26)
    doc.text(`Total Cameras: ${data.length}   Working: ${working}   Rate: ${Math.round(working / data.length * 100)}%`, 14, 32)

    autoTable(doc, {
      startY: 40,
      head: [['Camera ID', 'Location', 'Status', 'Last Checked', 'Technician', 'Notes']],
      body: data.map(r => [
        r.camera_name,
        r.location,
        r.status.replace('_', ' ').toUpperCase(),
        r.last_checked ? formatDateTime(r.last_checked) : '—',
        r.technician_name ?? '—',
        r.notes ?? '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      bodyStyles: {
        fillColor: (row: any) => {
          const status = row.cells[2]?.text?.[0] ?? ''
          if (status === 'NOT WORKING') return [254, 226, 226]
          if (status === 'UNDER MAINTENANCE') return [254, 249, 195]
          return [255, 255, 255]
        },
      } as any,
    })

    doc.save(`CCTV_Audit_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    toast.success('CCTV PDF downloaded')
    setLoading(null)
  }

  const REPORTS = [
    {
      title: 'Parking Report',
      desc: 'Vehicle entry/exit records with duration',
      excelId: 'parking-excel',
      pdfId: 'parking-pdf',
      onExcel: exportParkingExcel,
      onPDF: exportParkingPDF,
      color: 'blue',
    },
    {
      title: 'Attendance Report',
      desc: 'Guard daily attendance by date range',
      excelId: 'attendance-excel',
      pdfId: 'attendance-pdf',
      onExcel: exportAttendanceExcel,
      onPDF: exportAttendancePDF,
      color: 'green',
    },
    {
      title: 'Incident Report',
      desc: 'Security incidents and actions taken',
      excelId: 'incidents-excel',
      pdfId: 'incidents-pdf',
      onExcel: exportIncidentsExcel,
      onPDF: exportIncidentsPDF,
      color: 'red',
    },
    {
      title: 'CCTV Audit Report',
      desc: 'Current status of all cameras',
      excelId: 'cctv-excel',
      pdfId: 'cctv-pdf',
      onExcel: exportCCTVExcel,
      onPDF: exportCCTVPDF,
      color: 'teal',
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Reports & Export</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Generate and download reports as PDF or Excel
        </p>
      </div>

      <div className="card mb-6 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Select Date Range</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group mb-0">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group mb-0">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group mb-0 mt-3">
  <label>Filter Attendance by Guard (optional)</label>
  <select value={selectedGuard} onChange={e => setSelectedGuard(e.target.value)}>
    <option value="">All Guards</option>
    {guards.map(g => (
      <option key={g.id} value={g.id}>{g.name}</option>
    ))}
  </select>
</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <div key={r.title} className="card p-5">
            <div className="flex items-start gap-3 mb-5">
              <div className={`p-2.5 rounded-lg ${colorMap[r.color]}`}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{r.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={r.onExcel}
                disabled={loading === r.excelId}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium py-2.5 px-3 rounded-lg transition-colors"
              >
                {loading === r.excelId
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Download className="w-3.5 h-3.5" />
                }
                Excel
              </button>

              <button
                onClick={r.onPDF}
                disabled={loading === r.pdfId}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium py-2.5 px-3 rounded-lg transition-colors"
              >
                {loading === r.pdfId
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FileText className="w-3.5 h-3.5" />
                }
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}