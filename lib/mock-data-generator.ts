// Mock Data Generator for Hospital Analytics Platform
// Generates realistic hospital data for testing and demonstration

import { PatientRecord, Dataset } from './mock-database';

export class MockDataGenerator {
  private static readonly COMMON_DIAGNOSES = [
    'Malaria', 'Pneumonia', 'Diarrhea', 'Hypertension', 'Diabetes Mellitus',
    'Upper Respiratory Infection', 'Gastroenteritis', 'Typhoid Fever',
    'Urinary Tract Infection', 'Dengue Fever', 'COVID-19', 'Anemia',
    'Peptic Ulcer Disease', 'Asthma', 'Meningitis'
  ];

  private static readonly ICD10_CODES = {
    'Malaria': 'B54',
    'Pneumonia': 'J18.9',
    'Diarrhea': 'A09',
    'Hypertension': 'I10',
    'Diabetes Mellitus': 'E14.9',
    'Upper Respiratory Infection': 'J06.9',
    'Gastroenteritis': 'A09.9',
    'Typhoid Fever': 'A01.0',
    'Urinary Tract Infection': 'N39.0',
    'Dengue Fever': 'A91',
    'COVID-19': 'U07.1',
    'Anemia': 'D64.9',
    'Peptic Ulcer Disease': 'K27.9',
    'Asthma': 'J45.9',
    'Meningitis': 'G03.9'
  };

  private static readonly SERVICES = {
    opd: ['Consultation', 'Laboratory Test', 'X-Ray', 'Ultrasound', 'ECG', 'Vaccination', 'Health Education'],
    ipd: ['Admission', 'Surgery', 'Blood Transfusion', 'IV Therapy', 'Oxygen Therapy', 'Physiotherapy'],
    laboratory: ['Blood Test', 'Urine Test', 'Stool Test', 'CSF Analysis', 'Culture & Sensitivity', 'Histopathology'],
    pharmacy: ['Drug Dispensing', 'Counseling', 'Vaccination', 'Health Education'],
    rch: ['ANC Visit', 'PNC Visit', 'Family Planning', 'Immunization', 'Growth Monitoring', 'Nutrition Counseling']
  };

  private static readonly OUTCOMES = {
    opd: ['Discharged', 'Referred', 'Admitted', 'Left Against Medical Advice'],
    ipd: ['Discharged', 'Transferred', 'Referred', 'Died', 'Left Against Medical Advice'],
    laboratory: ['Test Completed', 'Sample Rejected', 'Referred'],
    pharmacy: ['Medication Dispensed', 'Counseling Provided', 'Referral Made']
  };

  // Generate OPD patient records
  static generateOPDRecords(count: number, startDate: Date, endDate: Date, datasetId: string): PatientRecord[] {
    const records: PatientRecord[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < count; i++) {
      const diagnosis = this.getRandomElement(this.COMMON_DIAGNOSES);
      const record: PatientRecord = {
        id: this.generateId(),
        datasetId,
        patientId: `PAT-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        age: this.generateAge(),
        sex: Math.random() > 0.5 ? 'male' : 'female',
        department: 'opd',
        diagnosis,
        icd10Code: this.ICD10_CODES[diagnosis as keyof typeof this.ICD10_CODES],
        serviceProvided: this.getRandomElement(this.SERVICES.opd),
        visitDate: this.generateRandomDate(startDate, endDate),
        outcome: this.getRandomElement(this.OUTCOMES.opd),
        referralStatus: Math.random() > 0.8 ? 'Referred' : 'Not Referred',
        waitingTime: Math.floor(Math.random() * 120) + 10 // 10-130 minutes
      };
      records.push(record);
    }

    return records.sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
  }

  // Generate IPD patient records
  static generateIPDRecords(count: number, startDate: Date, endDate: Date, datasetId: string): PatientRecord[] {
    const records: PatientRecord[] = [];

    for (let i = 0; i < count; i++) {
      const diagnosis = this.getRandomElement(this.COMMON_DIAGNOSES);
      const record: PatientRecord = {
        id: this.generateId(),
        datasetId,
        patientId: `PAT-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        age: this.generateAge(),
        sex: Math.random() > 0.5 ? 'male' : 'female',
        department: 'ipd',
        diagnosis,
        icd10Code: this.ICD10_CODES[diagnosis as keyof typeof this.ICD10_CODES],
        serviceProvided: this.getRandomElement(this.SERVICES.ipd),
        visitDate: this.generateRandomDate(startDate, endDate),
        outcome: this.getRandomElement(this.OUTCOMES.ipd),
        referralStatus: Math.random() > 0.7 ? 'Referred' : 'Not Referred',
        lengthOfStay: Math.floor(Math.random() * 14) + 1 // 1-14 days
      };
      records.push(record);
    }

    return records.sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
  }

  // Generate Laboratory records
  static generateLaboratoryRecords(count: number, startDate: Date, endDate: Date, datasetId: string): PatientRecord[] {
    const records: PatientRecord[] = [];

    for (let i = 0; i < count; i++) {
      const diagnosis = this.getRandomElement(['Laboratory Investigation', 'Routine Check', 'Pre-operative', 'Post-operative']);
      const record: PatientRecord = {
        id: this.generateId(),
        datasetId,
        patientId: `PAT-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        age: this.generateAge(),
        sex: Math.random() > 0.5 ? 'male' : 'female',
        department: 'laboratory',
        diagnosis,
        serviceProvided: this.getRandomElement(this.SERVICES.laboratory),
        visitDate: this.generateRandomDate(startDate, endDate),
        outcome: this.getRandomElement(this.OUTCOMES.laboratory),
        referralStatus: 'Not Referred'
      };
      records.push(record);
    }

    return records.sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
  }

  // Generate RCH (Reproductive & Child Health) records
  static generateRCHRecords(count: number, startDate: Date, endDate: Date, datasetId: string): PatientRecord[] {
    const rchDiagnoses = ['ANC Visit', 'PNC Visit', 'Family Planning', 'Immunization', 'Well Baby Visit', 'Growth Monitoring'];
    const records: PatientRecord[] = [];

    for (let i = 0; i < count; i++) {
      const diagnosis = this.getRandomElement(rchDiagnoses);
      const record: PatientRecord = {
        id: this.generateId(),
        datasetId,
        patientId: `PAT-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        age: this.generateRCHAge(diagnosis),
        sex: diagnosis.includes('ANC') || diagnosis.includes('PNC') || diagnosis.includes('Family Planning') ? 'female' : 
             Math.random() > 0.5 ? 'male' : 'female',
        department: 'rch',
        diagnosis,
        serviceProvided: this.getRandomElement(this.SERVICES.rch),
        visitDate: this.generateRandomDate(startDate, endDate),
        outcome: 'Service Completed',
        referralStatus: Math.random() > 0.9 ? 'Referred' : 'Not Referred'
      };
      records.push(record);
    }

    return records.sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
  }

  // Generate sample datasets
  static generateSampleDatasets(): Dataset[] {
    return [
      {
        id: 'sample-opd-2024',
        name: 'OPD_Visits_2024_Sample',
        description: 'Sample outpatient department visits for 2024',
        department: 'opd',
        fileType: 'excel',
        uploadedBy: 'system',
        uploadedAt: new Date(),
        rowCount: 5000,
        columns: ['patientId', 'age', 'sex', 'visitDate', 'diagnosis', 'serviceProvided', 'outcome', 'waitingTime'],
        isProcessed: true,
        tags: ['sample', 'opd', '2024']
      },
      {
        id: 'sample-ipd-2024',
        name: 'IPD_Admissions_2024_Sample',
        description: 'Sample inpatient department admissions for 2024',
        department: 'ipd',
        fileType: 'csv',
        uploadedBy: 'system',
        uploadedAt: new Date(),
        rowCount: 1200,
        columns: ['patientId', 'age', 'sex', 'admissionDate', 'diagnosis', 'lengthOfStay', 'outcome'],
        isProcessed: true,
        tags: ['sample', 'ipd', '2024']
      },
      {
        id: 'sample-lab-2024',
        name: 'Laboratory_2024_Sample',
        description: 'Sample laboratory investigations for 2024',
        department: 'laboratory',
        fileType: 'excel',
        uploadedBy: 'system',
        uploadedAt: new Date(),
        rowCount: 3000,
        columns: ['patientId', 'age', 'sex', 'testDate', 'testType', 'result', 'interpretation'],
        isProcessed: true,
        tags: ['sample', 'laboratory', '2024']
      },
      {
        id: 'sample-rch-2024',
        name: 'RCH_Services_2024_Sample',
        description: 'Sample reproductive and child health services for 2024',
        department: 'rch',
        fileType: 'csv',
        uploadedBy: 'system',
        uploadedAt: new Date(),
        rowCount: 2500,
        columns: ['patientId', 'age', 'sex', 'visitDate', 'serviceType', 'gestationalAge', 'outcome'],
        isProcessed: true,
        tags: ['sample', 'rch', '2024']
      }
    ];
  }

  // Helper methods
  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private static generateAge(): number {
    // Generate realistic age distribution
    const rand = Math.random();
    if (rand < 0.15) return Math.floor(Math.random() * 5); // Under 5: 15%
    if (rand < 0.35) return Math.floor(Math.random() * 15) + 5; // 5-19: 20%
    if (rand < 0.75) return Math.floor(Math.random() * 30) + 20; // 20-49: 40%
    if (rand < 0.90) return Math.floor(Math.random() * 20) + 50; // 50-69: 15%
    return Math.floor(Math.random() * 30) + 70; // 70+: 10%
  }

  private static generateRCHAge(service: string): number {
    switch (service) {
      case 'ANC Visit':
      case 'PNC Visit':
      case 'Family Planning':
        return Math.floor(Math.random() * 25) + 15; // 15-40 years
      case 'Immunization':
      case 'Well Baby Visit':
      case 'Growth Monitoring':
        return Math.floor(Math.random() * 5); // 0-5 years
      default:
        return this.generateAge();
    }
  }

  private static generateRandomDate(startDate: Date, endDate: Date): Date {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return new Date(start + Math.random() * (end - start));
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Generate epidemiological data with seasonal patterns
  static generateSeasonalData(diagnosis: string, startDate: Date, endDate: Date, datasetId: string): PatientRecord[] {
    const records: PatientRecord[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Seasonal patterns
    const seasonalPatterns = {
      'Malaria': [0.5, 0.6, 0.8, 1.2, 1.5, 1.8, 2.0, 1.9, 1.6, 1.2, 0.8, 0.6], // Peak in rainy season (Jun-Aug)
      'Pneumonia': [1.2, 1.1, 0.9, 0.7, 0.6, 0.5, 0.5, 0.6, 0.8, 1.0, 1.3, 1.4], // Peak in cold season
      'Diarrhea': [0.8, 0.9, 1.1, 1.3, 1.2, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.0] // Relatively stable
    };

    const pattern = seasonalPatterns[diagnosis as keyof typeof seasonalPatterns] || Array(12).fill(1.0);
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const month = currentDate.getMonth();
      const seasonalMultiplier = pattern[month];
      
      // Base daily cases with seasonal variation
      const baseCases = Math.floor(Math.random() * 10) + 5;
      const dailyCases = Math.floor(baseCases * seasonalMultiplier);
      
      for (let j = 0; j < dailyCases; j++) {
        const record: PatientRecord = {
          id: this.generateId(),
          datasetId,
          patientId: `PAT-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
          age: this.generateAge(),
          sex: Math.random() > 0.5 ? 'male' : 'female',
          department: 'opd',
          diagnosis,
          icd10Code: this.ICD10_CODES[diagnosis as keyof typeof this.ICD10_CODES],
          serviceProvided: this.getRandomElement(this.SERVICES.opd),
          visitDate: currentDate,
          outcome: this.getRandomElement(this.OUTCOMES.opd),
          referralStatus: Math.random() > 0.8 ? 'Referred' : 'Not Referred',
          waitingTime: Math.floor(Math.random() * 120) + 10
        };
        records.push(record);
      }
    }

    return records;
  }
}
