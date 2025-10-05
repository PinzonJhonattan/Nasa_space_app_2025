import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Activity } from '../models/activity.model';

export interface WeatherData {
  time: string[];
  temp: number[];
  humidity: number[];
  wind: number[];
  precipitation: number[];
}

export interface PdfReportData {
  activity: Activity;
  weatherData: WeatherData;
  probabilities: any[];
  date: Date;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  comfortLevel: number;
}

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor() { }

  async generateWeatherReport(data: PdfReportData): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

    // Configurar fuentes y colores
    pdf.setFont('helvetica', 'bold');
    
    // Report title
    pdf.setFontSize(20);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Weather Report - NASA Space App', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Activity information
    pdf.setFontSize(16);
    pdf.setTextColor(68, 68, 68);
    pdf.text(`Activity: ${data.activity.title}`, 20, currentY);
    currentY += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Description: ${data.activity.description}`, 20, currentY);
    currentY += 8;
    pdf.text(`Category: ${data.activity.category}`, 20, currentY);
    currentY += 12;

    // Date and location information
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Event Details', 20, currentY);
    currentY += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const formattedDate = data.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`Date: ${formattedDate}`, 20, currentY);
    currentY += 6;
    pdf.text(`Schedule: ${data.startTime} - ${data.endTime}`, 20, currentY);
    currentY += 6;
    pdf.text(`Location: ${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°`, 20, currentY);
    currentY += 15;

    // General comfort level
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Comfort Analysis', 20, currentY);
    currentY += 8;

    // Create a visual comfort level indicator
    const comfortColor = this.getComfortColorRGB(data.comfortLevel);
    pdf.setFillColor(comfortColor.r, comfortColor.g, comfortColor.b);
    pdf.rect(20, currentY, (data.comfortLevel / 100) * 80, 8, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(20, currentY, 80, 8, 'S');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.text(`${data.comfortLevel}% Comfortable`, 110, currentY + 6);
    currentY += 15;

    // Comfort description
    pdf.setFontSize(10);
    pdf.text(this.getComfortDescription(data.comfortLevel), 20, currentY);
    currentY += 15;

    // Capture charts if elements exist
    try {
      currentY = await this.addChartsToPDF(pdf, currentY, pageWidth, pageHeight);
    } catch (error) {
      console.warn('Could not capture charts:', error);
    }

    // Probability table
    currentY = this.addProbabilityTable(pdf, data.probabilities, currentY, pageWidth);

    // Weather conditions summary
    if (data.weatherData) {
      currentY = this.addWeatherSummary(pdf, data.weatherData, currentY, pageWidth, pageHeight);
    }

    // Footer
    this.addFooter(pdf, pageWidth, pageHeight);

    // Generate filename with date
    const fileName = `weather-report-${data.activity.title.toLowerCase().replace(/\s+/g, '-')}-${data.date.toISOString().split('T')[0]}.pdf`;
    
    // Download PDF
    pdf.save(fileName);
  }

  private async addChartsToJSON(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    // Intentar capturar las gráficas principales
    const chartElements = [
      document.querySelector('[data-pc-name="chart"]'),
      document.querySelector('.discomfort-chart'),
      document.querySelector('[data-pc-name="knob"]')
    ];

    for (const element of chartElements) {
      if (element && currentY < pageHeight - 60) {
        try {
          const canvas = await html2canvas(element as HTMLElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 160;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Verificar si necesitamos una nueva página
          if (currentY + imgHeight > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
          }
          
          pdf.addImage(imgData, 'PNG', 25, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        } catch (error) {
          console.warn('Error al capturar gráfica:', error);
        }
      }
    }

    return currentY;
  }

  private async addChartsToAPI(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Climate Charts', 20, currentY);
    currentY += 10;

    // Try to capture the entire conditions analysis section
    const analysisSection = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.gap-6');
    
    if (analysisSection) {
      try {
        const canvas = await html2canvas(analysisSection as HTMLElement, {
          scale: 1.5,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if we need a new page
        if (currentY + imgHeight > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 15;
      } catch (error) {
        console.warn('Error capturing analysis section:', error);
        // If it fails, add alternative text
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text('Charts could not be included in this report.', 20, currentY);
        currentY += 15;
      }
    }

    return currentY;
  }

  private async addChartsToOLD(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Gráficas Climáticas', 20, currentY);
    currentY += 10;

    // Intentar capturar la gráfica de barras de factores de incomodidad
    const barChartElement = document.querySelector('p-chart[type="bar"]');
    if (barChartElement) {
      try {
        const canvas = await html2canvas(barChartElement as HTMLElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 160;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (currentY + imgHeight > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 25, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      } catch (error) {
        console.warn('Error al capturar gráfica de barras:', error);
      }
    }

    // Intentar capturar el medidor de confort
    const knobElement = document.querySelector('p-knob');
    if (knobElement) {
      try {
        const canvas = await html2canvas(knobElement as HTMLElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 80;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', pageWidth - 100, currentY - imgHeight, imgWidth, imgHeight);
      } catch (error) {
        console.warn('Error al capturar medidor de confort:', error);
      }
    }

    return currentY;
  }

  private async addChartsToXXX(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    return this.addChartsToAPI(pdf, currentY, pageWidth, pageHeight);
  }

  private async addChartsToAAA(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    return this.addChartsToAPI(pdf, currentY, pageWidth, pageHeight);
  }

  private async addChartsToIII(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    return this.addChartsToAPI(pdf, currentY, pageWidth, pageHeight);
  }

  private async addChartsToJJJ(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    return this.addChartsToAPI(pdf, currentY, pageWidth, pageHeight);
  }

  private async addChartsToZZZ(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    return this.addChartsToAPI(pdf, currentY, pageWidth, pageHeight);
  }

  private async addChartsToPDF(pdf: jsPDF, currentY: number, pageWidth: number, pageHeight: number): Promise<number> {
    return this.addChartsToAPI(pdf, currentY, pageWidth, pageHeight);
  }

  private addProbabilityTable(pdf: jsPDF, probabilities: any[], currentY: number, pageWidth: number): number {
    if (!probabilities || probabilities.length === 0) return currentY;

    // Check if we need a new page
    if (currentY > 200) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Discomfort Factors', 20, currentY);
    currentY += 15;

    // Filter out general comfort level
    const factors = probabilities.filter(p => p.label !== 'Nivel de Confort General' && p.label !== 'General Comfort Level');

    // Draw table
    const tableX = 20;
    const tableWidth = pageWidth - 40;
    const rowHeight = 12;
    
    // Headers
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(tableX, currentY, tableWidth, rowHeight, 'F');
    pdf.text('Climate Factor', tableX + 5, currentY + 8);
    pdf.text('Percentage', tableX + tableWidth - 30, currentY + 8);
    currentY += rowHeight;

    // Data
    pdf.setFont('helvetica', 'normal');
    factors.forEach((factor, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(tableX, currentY, tableWidth, rowHeight, 'F');
      }
      
      pdf.text(factor.label, tableX + 5, currentY + 8);
      pdf.text(`${factor.percentage}%`, tableX + tableWidth - 30, currentY + 8);
      currentY += rowHeight;
    });

    return currentY + 10;
  }

  private addWeatherSummary(pdf: jsPDF, weatherData: WeatherData, currentY: number, pageWidth: number, pageHeight: number): number {
    if (currentY > pageHeight - 80) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Weather Summary', 20, currentY);
    currentY += 15;

    // Calculate statistics
    const temps = weatherData.temp;
    const winds = weatherData.wind;
    const humidity = weatherData.humidity;
    const precipitation = weatherData.precipitation;

    const tempMin = Math.min(...temps);
    const tempMax = Math.max(...temps);
    const tempAvg = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
    const windMax = Math.max(...winds);
    const humidityAvg = humidity.reduce((a: number, b: number) => a + b, 0) / humidity.length;
    const totalPrecip = precipitation.reduce((a: number, b: number) => a + b, 0);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    const summaryData = [
      `• Temperature: ${tempMin.toFixed(1)}°C - ${tempMax.toFixed(1)}°C (average: ${tempAvg.toFixed(1)}°C)`,
      `• Maximum wind: ${windMax.toFixed(1)} km/h`,
      `• Average humidity: ${humidityAvg.toFixed(1)}%`,
      `• Total precipitation: ${totalPrecip.toFixed(1)} mm`
    ];

    summaryData.forEach(line => {
      pdf.text(line, 20, currentY);
      currentY += 7;
    });

    return currentY + 10;
  }

  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    
    const footerText = `Generated on ${new Date().toLocaleDateString('en-US')} at ${new Date().toLocaleTimeString('en-US')}`;
    pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text('NASA Space App - Weather Report', 20, pageHeight - 10);
  }

  private getComfortColorRGB(percentage: number): { r: number, g: number, b: number } {
    if (percentage >= 70) return { r: 74, g: 222, b: 128 }; // Verde
    if (percentage >= 40) return { r: 251, g: 191, b: 36 }; // Amarillo
    return { r: 239, g: 68, b: 68 }; // Rojo
  }

  private getComfortDescription(percentage: number): string {
    if (percentage >= 80) return 'Excellent conditions for the activity';
    if (percentage >= 60) return 'Good conditions, slightly uncomfortable';
    if (percentage >= 40) return 'Moderate conditions, consider precautions';
    if (percentage >= 20) return 'Challenging conditions, caution recommended';
    return 'Very difficult conditions, consider postponing the activity';
  }
}
