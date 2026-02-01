import { env } from '../../lib/env';

export const toMgdl = (mmol: number) => parseFloat((mmol * 18).toFixed(1));
export const toMmol = (mgdl: number) => parseFloat((mgdl / 18).toFixed(1));

// Accepts numbers that are multiples of 0.5 (within float epsilon)
export const isHalfStepNumber = (value: number) => {
  const HALF_STEP_EPS = 1e-6;
  return Number.isFinite(value) && Math.abs(value * 2 - Math.round(value * 2)) < HALF_STEP_EPS;
};

class LogsService {
  // Real-time health monitoring khi user log data
  async checkHealthOnLog(userId: string, logType: string, data: any) {
    try {
      // Check glucose levels ngay lập tức
      if (logType === 'glucose' && data.value) {
        const glucoseValue = parseFloat(data.value);
        
        // Nguy hiểm cao nếu >250 hoặc <70
        if (glucoseValue > 250 || glucoseValue < 70) {
          await this.sendHealthAlert(userId, {
            type: 'glucose_critical',
            title: `Cảnh báo đường huyết nguy hiểm`,
            message: `Đường huyết: ${glucoseValue} mg/dL ${glucoseValue > 250 ? '(quá cao)' : '(quá thấp)'}`,
            severity: 'critical',
            alertType: 'glucose_critical',
            icon: 'alert-circle',
            value: glucoseValue
          });

        }
        // Cảnh báo nếu >180 hoặc <90 
        else if (glucoseValue > 180 || glucoseValue < 90) {
          await this.sendHealthAlert(userId, {
            type: 'glucose_warning', 
            title: 'Cảnh báo đường huyết',
            message: `Đường huyết: ${glucoseValue} mg/dL ${glucoseValue > 180 ? '(cao)' : '(thấp)'}`,
            severity: 'warning',
            alertType: 'glucose_warning',
            icon: 'warning',
            value: glucoseValue
          });

        }
      }
      
      // Check blood pressure ngay lập tức
      if (logType === 'blood-pressure' && data.systolic && data.diastolic) {
        const systolic = parseFloat(data.systolic);
        const diastolic = parseFloat(data.diastolic);
        
        // Nguy hiểm cao
        if (systolic >= 180 || diastolic >= 110) {
          await this.sendHealthAlert(userId, {
            type: 'blood_pressure_critical',
            title: 'Cảnh báo huyết áp nguy hiểm',
            message: `Huyết áp: ${systolic}/${diastolic} mmHg (quá cao)`,
            severity: 'critical',
            alertType: 'blood_pressure_critical',
            icon: 'alert-circle',
            systolic,
            diastolic
          });

        }
        // Cảnh báo nếu cao
        else if (systolic >= 140 || diastolic >= 90) {
          await this.sendHealthAlert(userId, {
            type: 'blood_pressure_warning',
            title: 'Cảnh báo huyết áp',
            message: `Huyết áp: ${systolic}/${diastolic} mmHg (cao)`,
            severity: 'warning', 
            alertType: 'blood_pressure_warning',
            icon: 'warning',
            systolic,
            diastolic
          });

        }
      }
    } catch (error) {
      console.error('Lỗi kiểm tra sức khỏe real-time:', error);
    }
  }
  
  private async sendHealthAlert(userId: string, alertData: any) {
    try {
      // Gửi notification cho user
      await this.createNotification(userId, {
        type: 'health_alert',
        title: alertData.title,
        message: alertData.message,
        data: {
          type: 'health_alert',
          alertType: alertData.alertType,
          severity: alertData.severity,
          ...alertData
        }
      });
      
      // Gửi cho care-circle nếu mức độ nguy hiểm
      if (alertData.severity === 'critical') {
        await this.notifyCareCircle(userId, alertData);
      }
    } catch (error) {
      console.error('Lỗi gửi cảnh báo sức khỏe:', error);
    }
  }
  
  private async notifyCareCircle(userId: string, alertData: any) {
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/health/alert-care-circle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          alertData
        })
      });
      
      if (!response.ok) {
        throw new Error('Không thể gửi cảnh báo cho care-circle');
      }
    } catch (error) {
      console.error('Lỗi gửi cảnh báo cho care-circle:', error);
    }
  }
  
  private async createNotification(userId: string, notification: any) {
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...notification
        })
      });
      
      if (!response.ok) {
        throw new Error('Không thể tạo notification');
      }
    } catch (error) {
      console.error('Lỗi tạo notification:', error);
    }
  }
}

export const logsService = new LogsService();
