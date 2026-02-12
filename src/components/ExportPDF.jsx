import { Download } from 'lucide-react'

export default function ExportPDF() {
  const handleExport = async () => {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const green = [22, 101, 52]
    const warm = [180, 83, 9]

    // Load data from localStorage
    const itinerary = JSON.parse(localStorage.getItem('ireland-itinerary') || '[]')
    const golf = JSON.parse(localStorage.getItem('ireland-golf') || '[]')
    const budget = JSON.parse(localStorage.getItem('ireland-budget') || '{"categories":[],"travelers":4}')
    const packing = JSON.parse(localStorage.getItem('ireland-packing') || '[]')
    const tripDate = localStorage.getItem('ireland-trip-date')?.replace(/"/g, '') || ''

    let y = 20

    // Title
    doc.setFontSize(24)
    doc.setTextColor(...green)
    doc.text('Ireland Family Trip', 105, y, { align: 'center' })
    y += 8
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    if (tripDate) {
      doc.text(`Departure: ${tripDate}`, 105, y, { align: 'center' })
      y += 6
    }
    y += 6

    // Itinerary
    doc.setFontSize(16)
    doc.setTextColor(...green)
    doc.text('Itinerary', 14, y)
    y += 8

    itinerary.forEach(day => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFontSize(12)
      doc.setTextColor(50, 50, 50)
      doc.text(`${day.label}${day.date ? ` (${day.date})` : ''}`, 14, y)
      y += 6

      if (day.activities.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Time', 'Activity', 'Location', 'Duration', 'Notes']],
          body: day.activities.map(a => [
            a.time || '', a.title, a.location || '', a.duration || '', a.notes || ''
          ]),
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: green },
          margin: { left: 14 },
        })
        y = doc.lastAutoTable.finalY + 8
      } else {
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('No activities planned', 18, y)
        y += 6
      }
    })

    // Golf Courses
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFontSize(16)
    doc.setTextColor(...green)
    doc.text('Golf Courses', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Course', 'Location', 'Green Fee', 'Status', 'Notes']],
      body: golf.map(c => [c.name, c.location, c.greenFee, c.bookingStatus, c.notes || '']),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: green },
      margin: { left: 14 },
    })
    y = doc.lastAutoTable.finalY + 10

    // Budget
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFontSize(16)
    doc.setTextColor(...warm)
    doc.text('Budget', 14, y)
    y += 4

    const totalEst = budget.categories.reduce((s, c) => s + Number(c.estimated || 0), 0)
    const totalAct = budget.categories.reduce((s, c) => s + Number(c.actual || 0), 0)

    autoTable(doc, {
      startY: y,
      head: [['Category', 'Estimated (€)', 'Actual (€)', 'Notes']],
      body: [
        ...budget.categories.map(c => [c.name, c.estimated, c.actual, c.notes || '']),
        [{ content: 'TOTAL', styles: { fontStyle: 'bold' } },
         { content: totalEst.toString(), styles: { fontStyle: 'bold' } },
         { content: totalAct.toString(), styles: { fontStyle: 'bold' } },
         ''],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: warm },
      margin: { left: 14 },
    })
    y = doc.lastAutoTable.finalY + 6
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Per person (${budget.travelers} travelers): €${Math.round(totalEst / (budget.travelers || 1))} estimated`, 14, y)
    y += 10

    // Packing List
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFontSize(16)
    doc.setTextColor(...green)
    doc.text('Packing List', 14, y)
    y += 4

    const categories = [...new Set(packing.map(i => i.category))]
    const packingBody = []
    categories.forEach(cat => {
      packingBody.push([{ content: cat, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } }])
      packing.filter(i => i.category === cat).forEach(item => {
        packingBody.push([item.checked ? '✓' : '☐', item.item])
      })
    })

    autoTable(doc, {
      startY: y,
      body: packingBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 12 } },
      margin: { left: 14 },
    })

    doc.save('Ireland-Trip-Plan.pdf')
  }

  return (
    <button onClick={handleExport} className="btn-warm flex items-center gap-2">
      <Download size={16} /> Export PDF
    </button>
  )
}
