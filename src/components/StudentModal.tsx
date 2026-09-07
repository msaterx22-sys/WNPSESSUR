import React, { useState, useEffect, useRef } from 'react';
import { Student, StandardClass } from '../types';
import { useSchool } from '../context/SchoolContext';
import { X, UserPlus, Bus, Trophy, AlertCircle, Camera, Upload, Trash2, ShieldCheck, Check } from 'lucide-react';

interface StudentModalProps {
  studentToEdit?: Student | null;
  onClose: () => void;
  onSuccess: (student: Student) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({ 
  studentToEdit, 
  onClose, 
  onSuccess 
}) => {
  const { feeStructure, addStudent, updateStudent, deleteStudent, students, classList } = useSchool();

  const [standard, setStandard] = useState<StandardClass>(
    studentToEdit?.standard || classList[0] || 'LKG'
  );
  const [section, setSection] = useState<string>(studentToEdit?.section || 'A');
  const [name, setName] = useState<string>(studentToEdit?.name || '');
  const [admissionNo, setAdmissionNo] = useState<string>(
    studentToEdit?.admissionNo || `WIS-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`
  );
  const [rollNo, setRollNo] = useState<string>(studentToEdit?.rollNo || String(students.length + 1).padStart(2, '0'));
  const [gender, setGender] = useState<'Boy' | 'Girl'>(studentToEdit?.gender || 'Boy');
  const [parentName, setParentName] = useState<string>(studentToEdit?.parentName || '');
  const [parentPhone, setParentPhone] = useState<string>(studentToEdit?.parentPhone || '');
  const [whatsappNumber, setWhatsappNumber] = useState<string>(studentToEdit?.whatsappNumber || '');
  const [address, setAddress] = useState<string>(studentToEdit?.address || 'Essur - 603301');
  const [dateOfBirth, setDateOfBirth] = useState<string>(studentToEdit?.dateOfBirth || '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(studentToEdit?.photoUrl);

  // RTE Quota State
  const [isRte, setIsRte] = useState<boolean>(studentToEdit?.isRte ?? false);
  const [rteApplicationNo, setRteApplicationNo] = useState<string>(studentToEdit?.rteApplicationNo || '');
  const [rteGovtReimbursed, setRteGovtReimbursed] = useState<boolean>(studentToEdit?.rteGovtReimbursed ?? false);

  // Fees
  const [tuitionFee, setTuitionFee] = useState<number>(() => {
    if (studentToEdit) return studentToEdit.tuitionFee;
    return feeStructure[standard] ?? 16500;
  });
  const [vanFacility, setVanFacility] = useState<boolean>(studentToEdit?.vanFacility ?? false);
  const [vanRoute, setVanRoute] = useState<string>(studentToEdit?.vanRoute || 'Essur Main Road');
  const [vanFee, setVanFee] = useState<number>(studentToEdit?.vanFee ?? 4000);

  const [sportsFacility, setSportsFacility] = useState<boolean>(studentToEdit?.sportsFacility ?? true);
  const [sportsFee, setSportsFee] = useState<number>(studentToEdit?.sportsFee ?? 1200);

  const [lateFee, setLateFee] = useState<number>(studentToEdit?.lateFee || 0);
  const [discount, setDiscount] = useState<number>(studentToEdit?.discount || 0);
  const [notes, setNotes] = useState<string>(studentToEdit?.notes || '');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When standard changes, update tuition fee default unless editing
  const handleStandardChange = (newStandard: StandardClass) => {
    setStandard(newStandard);
    if (!studentToEdit) {
      if (isRte) {
        setTuitionFee(0);
      } else {
        setTuitionFee(feeStructure[newStandard] || 16500);
      }
    }
  };

  // When RTE toggle changes
  const handleRteToggle = (checked: boolean) => {
    setIsRte(checked);
    if (checked) {
      setTuitionFee(0);
      if (!rteApplicationNo) {
        setRteApplicationNo(`TN-RTE-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`);
      }
    } else {
      setTuitionFee(feeStructure[standard] || 16500);
    }
  };

  const handlePhoneChange = (val: string) => {
    setParentPhone(val);
    if (!whatsappNumber || whatsappNumber === parentPhone) {
      setWhatsappNumber(val);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Student name is required');
      return;
    }
    if (!parentPhone.trim()) {
      alert('Parent phone number is required');
      return;
    }

    const payload: Omit<Student, 'id'> = {
      admissionNo: admissionNo.trim(),
      rollNo: rollNo.trim(),
      name: name.trim(),
      standard,
      section,
      gender,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      whatsappNumber: (whatsappNumber || parentPhone).trim(),
      address: address.trim(),
      dateOfBirth: dateOfBirth.trim(),
      photoUrl,
      isRte,
      rteApplicationNo: isRte ? rteApplicationNo.trim() : undefined,
      rteGovtReimbursed: isRte ? rteGovtReimbursed : false,
      vanFacility,
      vanRoute: vanFacility ? vanRoute : '',
      vanFee: vanFacility ? Number(vanFee) : 0,
      sportsFacility,
      sportsFee: sportsFacility ? Number(sportsFee) : 0,
      tuitionFee: Number(tuitionFee) || 0,
      otherFee: 0,
      discount: Number(discount) || 0,
      lateFee: Number(lateFee) || 0,
      admissionDate: studentToEdit?.admissionDate || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    if (studentToEdit) {
      updateStudent(studentToEdit.id, payload);
      onSuccess({ ...payload, id: studentToEdit.id });
    } else {
      const created = addStudent(payload);
      onSuccess(created);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D312E]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E8E2] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#4F6D7A] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#89A894] rounded-lg text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {studentToEdit ? 'Edit Student & Fee Record' : 'Register New Student'}
              </h3>
              <p className="text-[11px] text-white/80">Wisdom Nursery and Primary School, Essur</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-md hover:bg-[#415A65] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Photo Upload & Student Basic Card */}
          <div className="bg-[#F2F4F2] p-3.5 rounded-lg border border-[#E2E8E2] flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {photoUrl ? (
                <div className="relative">
                  <img
                    src={photoUrl}
                    alt="Student Preview"
                    className="w-20 h-24 object-cover rounded-lg border-2 border-[#4F6D7A] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1.5 -right-1.5 bg-[#D68A6E] text-white p-1 rounded-full shadow hover:bg-[#C07055] transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-24 border-2 border-dashed border-[#89A894] rounded-lg bg-white flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-[#89A894]/10 transition-colors"
                >
                  <Camera className="w-6 h-6 text-[#89A894] mb-1" />
                  <span className="text-[10px] font-bold text-[#4F6D7A] leading-tight">
                    Upload Photo
                  </span>
                  <span className="text-[9px] text-[#6B7280]">for ID & Van</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-[#2D312E] text-sm">Student ID & Van Card Photo</span>
                <span className="text-[10px] text-[#4F6D7A] bg-[#89A894]/15 px-2 py-0.5 rounded font-semibold border border-[#89A894]/30">
                  CR80 / Pass Format
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Upload student passport photograph. Automatically applied to the Student Identity Card, Van Card, and Fee Records.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#E2E8E2] border border-[#E2E8E2] text-[#2D312E] rounded-md font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-[#4F6D7A]" />
                  {photoUrl ? 'Change Photo' : 'Select Photo File'}
                </button>
                {photoUrl && (
                  <span className="text-[11px] text-[#89A894] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Photo Attached
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Class & Admission Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F2F4F2] p-3 rounded-lg border border-[#E2E8E2]">
            <div>
              <label className="block font-bold text-[#2D312E] mb-1">Standard / Class</label>
              <select
                value={standard}
                onChange={(e) => handleStandardChange(e.target.value as StandardClass)}
                className="w-full border border-[#E2E8E2] rounded p-2 bg-white font-bold text-[#4F6D7A] focus:ring-2 focus:ring-[#89A894] outline-hidden"
              >
                {classList.map(cls => (
                  <option key={cls} value={cls}>
                    {cls} (₹{feeStructure[cls]?.toLocaleString('en-IN') || 0})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#2D312E] mb-1">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full border border-[#E2E8E2] rounded p-2 bg-white font-semibold text-[#2D312E] outline-hidden"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#2D312E] mb-1">Admission No</label>
              <input
                type="text"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="w-full border border-[#E2E8E2] rounded p-2 bg-white font-mono text-[#2D312E] outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2D312E] mb-1">Roll No</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full border border-[#E2E8E2] rounded p-2 bg-white font-mono text-[#2D312E] outline-hidden"
              />
            </div>
          </div>

          {/* RTE (Right to Education) Quota Section */}
          <div className={`p-3.5 rounded-lg border transition-all ${
            isRte 
              ? 'bg-[#89A894]/15 border-[#89A894]' 
              : 'bg-white border-[#E2E8E2]'
          }`}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRte}
                  onChange={(e) => handleRteToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4F6D7A] accent-[#4F6D7A]"
                />
                <ShieldCheck className={`w-4 h-4 ${isRte ? 'text-[#4F6D7A]' : 'text-[#6B7280]'}`} />
                <span className="font-bold text-[#2D312E] text-xs">
                  RTE Student (Right to Education 25% Free Seat Quota)
                </span>
              </label>

              {isRte && (
                <span className="bg-[#4F6D7A] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  RTE Active (₹0 Tuition)
                </span>
              )}
            </div>

            {isRte && (
              <div className="mt-3 pt-3 border-t border-[#89A894]/30 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-[#2D312E] mb-1">
                    RTE Gov Application / Reg No *
                  </label>
                  <input
                    type="text"
                    value={rteApplicationNo}
                    onChange={(e) => setRteApplicationNo(e.target.value)}
                    placeholder="e.g. TN-RTE-2024-0089"
                    className="w-full border border-[#89A894] rounded p-2 bg-white font-mono text-xs text-[#2D312E] outline-hidden"
                    required={isRte}
                  />
                  <span className="text-[10px] text-[#6B7280]">
                    District Education Office RTE allotment reference
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2D312E] mb-1">
                    State Government Reimbursement
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rteGovtReimbursed}
                      onChange={(e) => setRteGovtReimbursed(e.target.checked)}
                      className="w-4 h-4 rounded text-[#89A894] accent-[#89A894]"
                    />
                    <span className="text-xs text-[#2D312E]">
                      Government reimbursement received by school
                    </span>
                  </label>
                  <span className="text-[10px] text-[#6B7280]">
                    Standard class fee: ₹{feeStructure[standard]?.toLocaleString()} waived for family
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#2D312E] mb-1">Student Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kavin Kumar S"
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] font-semibold text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2D312E] mb-1">Gender</label>
              <div className="flex gap-2 pt-1">
                {(['Boy', 'Girl'] as const).map(g => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-colors ${
                      gender === g 
                        ? 'bg-[#4F6D7A] text-white border-[#4F6D7A]' 
                        : 'bg-[#F2F4F2] text-[#2D312E] border-[#E2E8E2]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parent & Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#2D312E] mb-1">Parent / Guardian Name *</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Senthil Nathan"
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] font-medium text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2D312E] mb-1">Parent Phone Number *</label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="10 digit mobile"
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] font-mono text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2D312E] mb-1">WhatsApp Number</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="For instant fee receipts"
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] font-mono text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#2D312E] mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Door No, Street, Essur - 603301"
              className="w-full border border-[#E2E8E2] rounded-lg p-2 bg-[#FDFDFB] text-[#2D312E] focus:bg-white outline-hidden"
            />
          </div>

          <div className="sm:w-56">
            <label className="block font-semibold text-[#2D312E] mb-1">Date of Birth</label>
            <input
              type="text"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              placeholder="DD-MM-YYYY"
              className="w-full border border-[#E2E8E2] rounded-lg p-2 bg-[#FDFDFB] text-[#2D312E] focus:bg-white outline-hidden"
            />
          </div>

          {/* Fee Configuration & Facilities */}
          <div className="border border-[#E2E8E2] rounded-lg p-3.5 bg-[#F2F4F2] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#2D312E] uppercase tracking-wide flex items-center gap-1.5 text-xs">
                Fee Setup & Facilities ({standard})
              </h4>
              {isRte && (
                <span className="text-[11px] font-bold text-[#4F6D7A] bg-[#89A894]/25 px-2 py-0.5 rounded">
                  RTE Seat: Tuition Waived
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#2D312E] mb-1">
                  Tuition Fee (Annual) {isRte && '(RTE Quota)'}
                </label>
                <input
                  type="number"
                  value={tuitionFee}
                  onChange={(e) => setTuitionFee(Number(e.target.value) || 0)}
                  disabled={isRte}
                  className={`w-full border border-[#E2E8E2] rounded p-2 font-mono font-bold text-[#4F6D7A] outline-hidden ${
                    isRte ? 'bg-[#E2E8E2] text-slate-500 cursor-not-allowed' : 'bg-white'
                  }`}
                />
                <span className="text-[10px] text-[#6B7280]">
                  {isRte ? '₹0 under RTE 25% Quota' : `Standard rate: ₹${feeStructure[standard]?.toLocaleString() || 0}`}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#2D312E] mb-1">Concession / Discount</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full border border-[#E2E8E2] rounded p-2 bg-white font-mono text-[#2D312E] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D68A6E] mb-1">Existing Late Fee / Fine</label>
                <input
                  type="number"
                  value={lateFee}
                  onChange={(e) => setLateFee(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full border border-[#D68A6E]/40 rounded p-2 bg-white font-mono text-[#D68A6E] outline-hidden"
                />
              </div>
            </div>

            {/* School Van Option */}
            <div className="pt-2 border-t border-[#E2E8E2]">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 font-semibold text-[#2D312E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vanFacility}
                    onChange={(e) => setVanFacility(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4F6D7A] accent-[#4F6D7A]"
                  />
                  <Bus className="w-4 h-4 text-[#D68A6E]" />
                  <span>Opt for School Van Facility</span>
                </label>
                {vanFacility && (
                  <span className="text-[#D68A6E] font-bold">Van Enabled</span>
                )}
              </div>

              {vanFacility && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div>
                    <label className="block text-[11px] text-[#6B7280] mb-1">Van Route / Pickup Point</label>
                    <input
                      type="text"
                      value={vanRoute}
                      onChange={(e) => setVanRoute(e.target.value)}
                      placeholder="e.g. Essur Main Road Gate 1"
                      className="w-full border border-[#E2E8E2] rounded p-2 bg-white text-xs text-[#2D312E] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#6B7280] mb-1">Van Fee Amount (₹)</label>
                    <input
                      type="number"
                      value={vanFee}
                      onChange={(e) => setVanFee(Number(e.target.value) || 0)}
                      className="w-full border border-[#E2E8E2] rounded p-2 bg-white font-mono text-xs font-semibold text-[#2D312E] outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sports Facility Option */}
            <div className="pt-2 border-t border-[#E2E8E2]">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 font-semibold text-[#2D312E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sportsFacility}
                    onChange={(e) => setSportsFacility(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4F6D7A] accent-[#4F6D7A]"
                  />
                  <Trophy className="w-4 h-4 text-[#4F6D7A]" />
                  <span>Opt for Sports & Activities</span>
                </label>
              </div>

              {sportsFacility && (
                <div className="pl-6 max-w-xs">
                  <label className="block text-[11px] text-[#6B7280] mb-1">Sports Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={sportsFee}
                    onChange={(e) => setSportsFee(Number(e.target.value) || 0)}
                    className="w-full border border-[#E2E8E2] rounded p-2 bg-white font-mono text-xs font-semibold text-[#2D312E] outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#2D312E] mb-1">Additional Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sibling concession / parent teacher remarks"
              className="w-full border border-[#E2E8E2] rounded-lg p-2 bg-[#FDFDFB] text-[#2D312E] outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#E2E8E2] flex items-center justify-between gap-2">
            {studentToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to permanently delete student ${studentToEdit.name} (${studentToEdit.admissionNo})?\n\nThis will remove their fee records and history.`)) {
                    deleteStudent(studentToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                title="Delete this student record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Student</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-[#6B7280] hover:bg-[#F2F4F2] rounded-lg transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 font-bold bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{studentToEdit ? 'Save Changes' : 'Register Student'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

