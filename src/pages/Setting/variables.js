export const Authority = {
  'Master Setting': 'settings.mastersetting',
  'Clinic Setting': 'settings.clinicsetting',
  'Print Setup': 'settings.printsetup',
  'System User': 'settings.systemuser',
  'User Preference': 'settings.userpreference',
  Templates: 'settings.template',
  Contact: 'settings.contact',
}

export const menuData = [
  {
    authority: 'settings.mastersetting.clinicinformation',
    title: 'Master Setting',
    text: 'Clinic Information',
    url: '/setting/clinicinfo',
  },
  {
    authority: 'settings.mastersetting.gstsetup',
    title: 'Master Setting',
    text: 'GST Setup',
    url: '/setting/gstsetup',
  },
  {
    authority: 'settings.mastersetting.generalsetting',
    title: 'Master Setting',
    text: 'General Setting',
    url: '/setting/generalsetting',
  },
  {
    // authority: 'settings.mastersetting.queuedisplaysetup',
    title: 'Master Setting',
    text: 'Queue Display Setup',
    url: '/setting/queuedisplaysetup',
  },
  {
    authority: 'settings.clinicsetting.service',
    title: 'Clinic Setting',
    text: 'Service',
    url: '/setting/service',
  },
  {
    authority: 'settings.clinicsetting.servicecenter',
    title: 'Clinic Setting',
    text: 'Service Center',
    // icon: <Business />,
    url: '/setting/servicecenter',
  },
  {
    authority: 'settings.clinicsetting.servicecentercategory',
    title: 'Clinic Setting',
    text: 'Service Center Category',
    // icon: <FolderOpen />,
    url: '/setting/servicecentercategory',
  },
  {
    authority: 'settings.clinicsetting.servicecategory',
    title: 'Clinic Setting',
    text: 'Service Category',
    // icon: <FolderOpen />,
    url: '/setting/servicecategory',
  },
  {
    authority: 'settings.clinicsetting.revenuecategory',
    title: 'Clinic Setting',
    text: 'Revenue Category',
    // icon: <FolderOpen />,
    url: '/setting/revenuecategory',
  },
  {
    authority: 'settings.clinicsetting.room',
    title: 'Clinic Setting',
    text: 'Room',
    url: '/setting/room',
  },
  {
    // authority: 'settings.clinicsetting.roomAssignment',
    title: 'Clinic Setting',
    text: 'Room Assignment',
    url: '/setting/roomassignment',
  },
  {
    authority: 'settings.clinicsetting.clinicoperationhour',
    title: 'Clinic Setting',
    text: 'Clinic Operation Hour',
    url: '/setting/clinicoperationhour',
  },
  {
    authority: 'settings.clinicsetting.clinicbreakhour',
    title: 'Clinic Setting',
    text: 'Clinic Break Hour',
    url: '/setting/clinicbreakhour',
  },
  {
    authority: 'settings.clinicsetting.publicholiday',
    title: 'Clinic Setting',
    text: 'Public Holiday',
    url: '/setting/publicholiday',
  },
  {
    authority: 'settings.clinicsetting.doctorblock',
    title: 'Clinic Setting',
    text: 'Doctor Block',
    url: '/setting/doctorblock',
  },
  // {
  //   title: 'Clinic Setting',
  //   text: 'Participant Role',
  //   url: '/setting/participantrole',
  // },
  {
    authority: 'settings.clinicsetting.roomblock',
    title: 'Clinic Setting',
    text: 'Room Block',
    url: '/setting/roomblock',
  },
  {
    authority: 'settings.clinicsetting.medicationuom',
    title: 'Clinic Setting',
    text: 'Medication UOM',
    url: '/setting/medicationuom',
  },
  {
    authority: 'settings.clinicsetting.consumableuom',
    title: 'Clinic Setting',
    text: 'Consumable UOM',
    url: '/setting/consumableuom',
  },
  {
    authority: 'settings.clinicsetting.medicationgroup',
    title: 'Clinic Setting',
    text: 'Medication Group',
    url: '/setting/medicationgroup',
  },
  {
    authority: 'settings.clinicsetting.consumablecategory',
    title: 'Clinic Setting',
    text: 'Consumable Category',
    url: '/setting/consumablegroup',
  },
  {
    authority: 'settings.clinicsetting.medicationdosage',
    title: 'Clinic Setting',
    text: 'Medication Dosage',
    url: '/setting/medicationdosage',
  },
  {
    authority: 'settings.clinicsetting.medicationprecaution',
    title: 'Clinic Setting',
    text: 'Medication Precaution',
    url: '/setting/medicationprecautions',
  },
  {
    authority: 'settings.clinicsetting.medicationfrequency',
    title: 'Clinic Setting',
    text: 'Medication Frequency',
    url: '/setting/medicationfrequency',
  },
  {
    authority: 'settings.clinicsetting.medicationconsumptionmethod',
    title: 'Clinic Setting',
    text: 'Medication Consumption Method',
    longText: true,
    url: '/setting/medicationconsumptionmethod',
  },
  {
    authority: 'settings.clinicsetting.paymentmode',
    title: 'Clinic Setting',
    text: 'Payment Mode',
    url: '/setting/paymentmode',
  },
  {
    authority: 'settings.clinicsetting.appointmenttype',
    title: 'Clinic Setting',
    text: 'Appointment Type',
    url: '/setting/appointmenttype',
  },
  {
    authority: 'settings.clinicsetting.treatment',
    title: 'Clinic Setting',
    text: 'Treatment',
    // icon: <FolderOpen />,
    url: '/setting/treatment',
  },
  {
    authority: 'settings.clinicsetting.treatmentcategory',
    title: 'Clinic Setting',
    text: 'Treatment Category',
    // icon: <FolderOpen />,
    url: '/setting/treatmentcategory',
  },

  {
    authority: 'settings.systemuser.systemuser',
    title: 'System User',
    text: 'System User',
    url: '/setting/userprofile',
  },
  {
    title: 'System User',
    text: 'Role & Access Right',
    url: '/setting/userrole',
  },
  {
    authority: 'settings.printsetup.printoutsetting',
    title: 'Print Setup',
    text: 'Printout Setting',
    url: '/setting/printoutsetting',
  },
  {
    authority: 'settings.templates.smstemplate',
    title: 'Templates',
    text: 'SMS Template',
    url: '/setting/smstemplate',
  },
  {
    authority: 'settings.templates.documenttemplate',
    title: 'Templates',
    text: 'Document Template',
    url: '/setting/documenttemplate',
  },
  {
    authority: 'settings.templates.visitordertemplate',
    title: 'Templates',
    text: 'Visit Order Template',
    url: '/setting/visitordertemplate',
  },
  // {
  //   title: 'Contact',
  //   text: 'Co-Payer',
  //   url: '/setting/company/1',
  // },
  {
    authority: 'settings.contact.supplier',
    title: 'Contact',
    text: 'Supplier',
    url: '/setting/company/2',
  },
  {
    authority: 'settings.contact.referralsource',
    title: 'Contact',
    text: 'Referral Source',
    url: '/setting/referralsource',
  },
]
