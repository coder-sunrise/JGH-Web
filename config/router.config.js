import devRoutes from './router.dev.config'

const _routes = [
  // login
  {
    path: '/user',
    component: '../layouts/LandingLayout',
    routes: [
      {
        path: '/user/login',
        component: './NewLogin',
        hideInMenu: true,
      },
      {
        path: '/user/forgotpassword',
        component: './ForgotPassword',
        hideInMenu: true,
      },
    ],
  },
  // Queue Display Dashboard
  {
    path: '/queuedisplay',
    component: '../layouts/BlankLayout',
    routes: [
      {
        path: '/queuedisplay/dashboard',
        component: './QueueDisplayDashboard',
        hideInMenu: true,
      },
    ],
  },
  // login
  //
  // Main routes
  {
    path: '/',
    component: '../layouts/BasicLayout',
    authority: ['reception/queue'],
    // Routes: [
    //   'src/pages/Authorized',
    // ],
    // authority: [
    //   { name: 'admin', rights: 'enable' },
    //   { name: 'user', rights: 'enable' },
    //   { name: 'guest', rights: 'enable' },
    //   { name: 'tester', rights: 'enable' },
    // ],
    routes: [
      // Main Landing Page.
      { path: '/', redirect: '/reception/queue' },
      // Reception
      { path: '/reception', redirect: '/reception/queue' },
      {
        path: '/reception',
        icon: 'icon-medicinebox-fill',
        name: 'reception',
        moduleName: 'Reception',
        authority: ['reception'],
        specialist: ['GP', 'Dental'],
        routes: [
          {
            path: '/reception/queue',
            name: 'queue',
            component: './Reception/Queue',
            mini: 'QE',
            exact: true,
            authority: ['reception/queue'],
          },
          {
            path: '/reception/appointment',
            name: 'appointment',
            mini: 'AP',
            component: './Reception/Appointment',
            authority: [
              'reception/appointment',
              // { name: 'reception/appointment' },
            ],
          },
          {
            path: '/reception/queue/consultation',
            name: 'consultation',
            observe: 'ConsultationPage',
            hideInMenu: true,
            exact: true,
            component: './Consultation',
            authority: ['reception/queue'],
          },
          {
            path: '/reception/queue/dispense',
            name: 'dispense',
            observe: 'EditOrder',
            hideInMenu: true,
            exact: true,
            component: './Dispense',
            authority: ['queue.dispense'],
          },
          {
            path: '/reception/queue/billing',
            name: 'billing',
            hideInMenu: true,
            exact: true,
            component: './Billing',
            authority: ['reception/queue'],
          },
          {
            hideInMenu: true,
            path: '/reception/queue/patientdashboard',
            name: 'patientdashboard',
            component: './PatientDashboard',
            authority: ['patientdashboard'],
          },
          {
            path: '/reception/labtracking',
            name: 'labTracking',
            component: './Reception/LabTracking',
            mini: 'LT',
            exact: true,
            authority: ['reception/labtracking'],
          },
          // {
          //   path: '/reception/queue/patientdashboard/consultation/:id?',
          //   name: 'consultation',
          //   hideInMenu: true,
          //   component: './PatientDashboard/Consultation',
          // },
        ],
      },
      {
        path: '/Pharmacy',
        icon: 'icon-medicinebox-fill',
        name: 'Pharmacy',
        moduleName: 'Reception',
        authority: ['reception'],
        specialist: ['GP', 'Dental'],
        routes: [
          {
            path: '/pharmacy/worklist',
            name: 'Worklist',
            component: './Pharmacy/Worklist',
            mini: 'WL',
            exact: true,
            authority: ['reception/labtracking'],
          },
          {
            path: '/reception/labtracking',
            name: 'History',
            component: './Reception/LabTracking',
            mini: 'HI',
            exact: true,
            authority: ['reception/labtracking'],
          },
        ],
      },
      //
      // Patient New
      {
        path: '/patient',
        icon: 'icon-team',
        name: 'patient',
        moduleName: 'PatientDataBase',
        authority: ['patientdatabase'],
        specialist: ['GP', 'Dental'],
        component: './Patient',
      },
      // Patient Database
      {
        path: '/patientdb',
        icon: 'icon-team',
        name: 'patient',
        moduleName: 'PatientDataBase',
        authority: ['patientdatabase'],
        specialist: ['GP', 'Dental'],
        component: './PatientDatabase/Search',
        // routes: [
        //   // {
        //   //   path: '/patientdb/new',
        //   //   name: 'new',
        //   //   mini: 'NP',
        //   //   component: './PatientDatabase/New',
        //   //   hideChildrenInMenu: true,
        //   //   routes: [
        //   //     {
        //   //       path: '/patientdb/new/personal',
        //   //       name: 'Personal Info',
        //   //       // component: './PatientDatabase/Personal',
        //   //     },
        //   //     {
        //   //       path: '/patientdb/new/emergency',
        //   //       name: 'Emergency Contact',
        //   //       // component: './PatientDatabase/EmergencyContact',
        //   //     },
        //   //     {
        //   //       path: '/patientdb/new/allergies',
        //   //       name: 'Allergies',
        //   //       // component: './PatientDatabase/Allergies',
        //   //     },
        //   //     {
        //   //       path: '/patientdb/new/schemes',
        //   //       name: 'Schemes',
        //   //       // component: './PatientDatabase/Schemes',
        //   //     },
        //   //   ],
        //   // },
        //   {
        //     path: '/patientdb/search',
        //     name: 'search',
        //     mini: 'SP',
        //     component: './PatientDatabase/Search',
        //     authority: [
        //       'patientdatabase',
        //     ],
        //   },
        // ],
      },
      //
      // SMS
      {
        path: '/communication',
        icon: 'icon-message',
        name: 'communication',
        moduleName: 'Communication',
        system: 'CMS',
        authority: ['communication'],
        specialist: ['GP'],
        routes: [
          {
            path: '/communication/sms',
            name: 'sms',
            component: './sms',
            authority: ['communication/sms'],
          },
          // {
          //   path: '/sms/adhoc',
          //   name: 'Adhoc',
          //   // component: './sms/adhoc',
          // },
        ],
      },
      //
      // Inventory
      {
        path: '/inventory',
        icon: 'icon-container-fill',
        name: 'inventory',
        moduleName: 'Inventory',
        // component: './inventory',
        authority: ['inventory'],
        specialist: ['GP'],
        routes: [
          {
            path: '/inventory/master',
            name: 'master',
            component: './Inventory/Master',
            authority: ['inventory/inventorymaster'],
            mini: 'IM',
          },
          {
            path: '/inventory/master/consumable',
            name: 'consumable.consumable',
            hideInMenu: true,
            component: './Inventory/Master/Consumable/Details',
            authority: ['inventory/inventorymaster'],
          },
          {
            path: '/inventory/master/editconsumable',
            name: 'consumable.editconsumable',
            hideInMenu: true,
            component: './Inventory/Master/Consumable/Details',
            authority: ['inventory/inventorymaster'],
          },
          {
            path: '/inventory/master/medication',
            name: 'medication.medication',
            hideInMenu: true,
            component: './Inventory/Master/Medication/Details',
            authority: ['inventory/inventorymaster'],
          },
          {
            path: '/inventory/master/editmedication',
            name: 'medication.editmedication',
            hideInMenu: true,
            component: './Inventory/Master/Medication/Details',
            authority: ['inventory/inventorymaster'],
          },
          {
            path: '/inventory/master/vaccination',
            name: 'vaccination.vaccination',
            hideInMenu: true,
            component: './Inventory/Master/Vaccination/Details',
            authority: ['inventory/inventorymaster'],
          },
          {
            path: '/inventory/master/editvaccination',
            name: 'vaccination.editvaccination',
            hideInMenu: true,
            component: './Inventory/Master/Vaccination/Details',
            authority: ['inventory/inventorymaster'],
          },
          {
            path: '/inventory/master/orderset',
            name: 'orderset.orderset',
            hideInMenu: true,
            component: './Inventory/Master/OrderSet/Details',
            authority: ['inventory/inventorymaster'],
          },
          {
            path: '/inventory/master/editorderset',
            name: 'orderset.editorderset',
            hideInMenu: true,
            component: './Inventory/Master/OrderSet/Details',
            authority: ['inventory/inventorymaster'],
          },
          // {
          //   path: '/inventory/pd',
          //   name: 'pd',
          //   // component: './Inventory/PurchaseReceving',
          //   mini: 'PD',
          // },
          // {
          //   path: '/inventory/pd/detail',
          //   name: 'pd.detail',
          //   hideInMenu: true,
          //   component: './Inventory/PurchaseDelivery/Detail',
          // },
          {
            path: '/inventory/pr',
            name: 'pd',
            component: './Inventory/PurchaseReceive',
            authority: ['inventory/purchasingandreceiving'],
            mini: 'PR',
          },
          {
            path: '/inventory/pr/pdodetails',
            name: 'pd.detail',
            hideInMenu: true,
            component: './Inventory/PurchaseReceive/Details',
            authority: ['inventory/purchasingandreceiving'],
          },
          {
            path: '/inventory/rg',
            name: 'rg',
            component: './Inventory/ReceivingGoods',
            authority: ['inventory/receivinggoods'],
            mini: 'RG',
          },
          {
            path: '/inventory/rg/rgdetails',
            name: 'rg.detail',
            hideInMenu: true,
            component: './Inventory/ReceivingGoods/Details',
            authority: ['inventory/receivinggoods'],
          },
          {
            path: '/inventory/inventoryadjustment',
            name: 'inventoryadjustment',
            component: './Inventory/InventoryAdjustment',
            authority: ['inventory/inventoryadjustment'],
            mini: 'IA',
          },
        ],
      },
      //
      // Test Component

      //
      // Finance
      {
        path: '/finance',
        icon: 'icon-Dollar',
        name: 'finance',
        moduleName: 'Finance',
        authority: ['finance'],
        specialist: ['GP'],
        routes: [
          {
            path: '/finance/invoice',
            name: 'invoice/list',
            component: './Finance/Invoice',
            mini: 'IP',
            exact: true,
            authority: ['finance/invoicepayment'],
          },
          {
            path: '/finance/invoice/details',
            name: 'invoice/detail',
            hideInMenu: true,
            component: './Finance/Invoice/Details',
            authority: ['finance/invoicepayment'],
          },
          {
            path: '/finance/note',
            name: 'credit/debitnote',
            hideInMenu: true,
            authority: ['finance/invoicepayment'],
            // component: './Finance/CreditDebitNote',
            mini: 'CD',
          },
          // {
          //   path: '/finance/billing',
          //   name: 'corporate-billing',
          //   mini: 'CB',
          //   exact: true,
          //   // component: './Finance/CorporateBilling',
          // },
          {
            path: '/finance/billing/:companyName',
            name: 'corporate-billing/detail',
            hideInMenu: true,
            authority: ['finance/corporatebilling'],
            // component:
            //   './Finance/CorporateBilling/Detail/CorporateBillingDetail',
          },
          {
            path: '/finance/deposit',
            name: 'deposit',
            mini: 'DP',
            component: './Finance/Deposit',
            authority: ['finance/deposit'],
          },
          {
            path: '/finance/deposit/:depositNo',
            name: 'invoice/detail',
            hideInMenu: true,
            component: './Finance/Deposit/Detail/index.js',
            authority: ['finance/deposit'],
          },
          {
            path: '/finance/statement',
            name: 'statement',
            mini: 'ST',
            component: './Finance/Statement',
            authority: ['finance/statement'],
          },
          {
            path: '/finance/statement/newstatement',
            name: 'statement/newstatement',
            hideInMenu: true,
            component: './Finance/Statement/NewStatement/AddNewStatement',
            authority: ['finance/statement'],
          },
          {
            path: '/finance/statement/editstatement/:id',
            name: 'statement/editstatement',
            hideInMenu: true,
            component: './Finance/Statement/NewStatement/AddNewStatement',
            authority: ['finance/statement'],
          },
          {
            path: '/finance/statement/details/:id',
            name: 'statement/detail',
            hideInMenu: true,
            component: './Finance/Statement/Details',
            authority: ['finance/statement'],
          },
          {
            path: '/finance/statement/statementpayment/:id',
            name: 'statement/statementpayment',
            hideInMenu: true,
            component: './Finance/Statement/StatementPayment',
            authority: ['finance/statement'],
          },
          // {
          //   path: '/finance/expense',
          //   name: 'doctor-expense',
          //   mini: 'DE',
          //   exact: true,
          //   component: './Finance/DoctorExpense',
          // },
          {
            path: '/finance/scheme',
            name: 'scheme',
            mini: 'SC',
            component: './Finance/Scheme',
            authority: ['finance/scheme'],
          },
          {
            path: '/finance/scheme/details',
            name: 'scheme/detail',
            hideInMenu: true,
            component: './Finance/Scheme/Details',
            authority: ['finance/scheme'],
          },
          {
            path: '/finance/copayer',
            name: 'copayer',
            mini: 'CP',
            component: './Setting/Company',
            authority: ['finance/copayer'],
          },
        ],
      },
      //
      // Lab Report
      // {
      //   path: '/labsresult',
      //   icon: 'poll',
      //   name: 'labsresult',
      //   // component: '',
      // },
      // Lab Report
      //
      // Report
      {
        path: '/report',
        icon: 'icon-Report',
        name: 'report',
        moduleName: 'Report',
        hideChildrenInMenu: true,
        authority: ['report'],
        specialist: ['GP'],
        routes: [
          {
            path: '/report',
            name: 'report',
            component: './Report',
            authority: ['report'],
          },
          {
            path: '/report/queuelisting',
            name: 'queueListingReport',
            component: './Report/QueueListing',
            authority: ['report.finance.queuelisting'],
          },
          {
            path: '/report/gstreport',
            name: 'gstReport',
            component: './Report/GSTReport',
            authority: ['report.finance.gst'],
          },
          {
            path: '/report/inventorymovementreport',
            name: 'inventoryMovementReport',
            component: './Report/InventoryMovementReport',
            authority: ['report.inventory.inventorymovement'],
          },
          {
            path: '/report/deposittransactionreport',
            name: 'depositTransactionReport',
            component: './Report/DepositTransactionReport',
            authority: ['report.finance.deposittransaction'],
          },
          {
            path: '/report/voidcreditnotereport',
            name: 'voidCreditNoteReport',
            component: './Report/VoidCreditNoteReport',
            authority: ['report.finance.voidcreditnoteandpayment'],
          },
          {
            path: '/report/saleslistingreport',
            name: 'salesListingReport',
            component: './Report/SalesListingReport',
            authority: ['report.finance.saleslisting'],
          },
          {
            path: '/report/invoicelistingreport',
            name: 'invoiceListingReport',
            component: './Report/InvoiceListingReport',
            authority: ['report.finance.invoicelisting'],
          },
          {
            path: '/report/lowstockreport',
            name: 'lowStockReport',
            component: './Report/LowStockReport',
            authority: ['report.inventory.lowstock'],
          },
          {
            path: '/report/chasclaimreport',
            name: 'chasClaimReport',
            component: './Report/ChasClaimReport',
            authority: ['report.finance.chasclaim'],
          },
          {
            path: '/report/creditnotelistingreport',
            name: 'creditNoteListingReport',
            component: './Report/CreditNoteListingReport',
            authority: ['report.finance.creditnotelisting'],
          },
          {
            path: '/report/patientlisting',
            name: 'patientListingReport',
            component: './Report/PatientListing',
            authority: ['report.finance.patientlisting'],
          },
          {
            path: '/report/paymentcollection',
            name: 'paymentCollection',
            component: './Report/PaymentCollection',
            authority: ['report.finance.paymentcollection'],
          },
          {
            path: '/report/outstandingpaymentreport',
            name: 'outstandingPaymentReport',
            component: './Report/OutstandingPaymentReport',
            authority: ['report.finance.outstandingpayment'],
          },
          {
            path: '/report/salesummary',
            name: 'salessummary',
            component: './Report/SalesSummary',
            authority: ['report.finance.salessummary'],
          },
          {
            path: '/report/visitlistingreport',
            name: 'visitListingReport',
            component: './Report/VisitListingReport',
            authority: ['report.admin.visitlistingreport'],
          },
          {
            path: '/report/diagnosistrending',
            name: 'diagnosistrending',
            component: './Report/DiagnosisTrending',
            authority: ['report.diagnosistrendingreport'],
          },
          {
            path: '/report/referralsourcereport',
            name: 'referralsourcereport',
            component: './Report/ReferralSourceReport',
            authority: ['report.other.referralsource'],
          },
          {
            path: '/report/sessionsummary',
            name: 'sessionsummary',
            component: './Report/SessionSummary',
            authority: ['report.admin.sessionsummary'],
          },
          {
            path: '/report/sessionsummary/:id',
            name: 'viewreport',
            component: './Report/SessionSummary/Details',
            authority: ['report.admin.sessionsummary'],
          },
          {
            path: '/report/inventorytrendingreport',
            name: 'inventorytrendingreport',
            component: './Report/InventoryTrendingReport',
            authority: ['report.inventory.inventorytrendingreport'],
          },
          {
            path: '/report/inventorystockcountreport',
            name: 'inventorystockcountreport',
            component: './Report/InventoryStockCountReport',
            authority: ['report.inventory.inventorystockcountreport'],
          },
          {
            path: '/report/inventorylistingreport',
            name: 'inventorylistingreport',
            component: './Report/InventoryListingReport',
            authority: ['report.inventory.inventorylistingreport'],
          },
          {
            path: '/report/patientageingreport',
            name: 'patientageingreport',
            component: './Report/PatientAgeingReport',
            authority: ['report.finance.patientageingreport'],
          },
          {
            path: '/report/purchasereceivinglistingreport',
            name: 'purchasereceivinglistingreport',
            component: './Report/purchasereceivinglistingreport',
            authority: ['report.inventory.purchasereceivinglistingreport'],
          },
          {
            path: '/report/statementsummaryreport',
            name: 'statementsummaryreport',
            component: './Report/StatementSummaryReport',
            authority: ['report.finance.statementsummaryreport'],
          },
          {
            path: '/report/paymentcollectionsummary',
            name: 'paymentcollectionsummary',
            component: './Report/PaymentCollectionSummary',
            authority: ['report.finance.paymentcollectionsummary'],
          },
          {
            path: '/report/wiprevenue',
            name: 'wiprevenue',
            component: './Report/WIPRevenue',
            authority: ['report.finance.wiprevenuereport'],
          },
          {
            path: '/report/saleslistingbyperformer',
            name: 'saleslistingbyperformer',
            component: './Report/SalesListingByPerformer',
            authority: ['report.finance.saleslistingbyperformerreport'],
          },
          {
            path: '/report/packageexpiry',
            name: 'packageexpiry',
            component: './Report/PackageExpiry',
            authority: ['report.finance.packageexpiryreport'],
          },
          {
            path: '/report/xeroinvoicesreport',
            name: 'xeroinvoicesreport',
            component: './Report/XeroInvoicesReport',
            authority: ['report.finance.xeroinvoicesreport'],
          },
          {
            path: '/report/expiringstockreport',
            name: 'expiringstockreport',
            component: './Report/expiringstockreport',
            authority: ['report.inventory.expiringstockreport'],
          },
        ],
      },
      // Report
      //
      // Human Resource
      {
        path: '/human-resource',
        icon: 'perm_identity',
        name: 'humanResource',
        hideInMenu: true,
        // component: '',
      },
      // Human Resource
      //
      // Claim Submission
      {
        path: '/claim-submission',
        icon: 'icon-container',
        name: 'claimSubmission',
        moduleName: 'Claim Submission',
        hideChildrenInMenu: true,
        authority: ['claimsubmission'],
        specialist: ['GP'],
        routes: [
          {
            path: '/claim-submission',
            name: 'chas',
            component: './ClaimSubmission',
            authority: ['claimsubmission'],
          },
          {
            path: '/claim-submission/chas',
            name: 'chas',
            component: './ClaimSubmission/chas',
            authority: ['claimsubmission'],
          },
          {
            path: '/claim-submission/chas/invoice/:invoiceNo',
            name: 'patientInvoice',
            hideInMenu: true,
            component: './Finance/Invoice/Details',
            authority: ['claimsubmission'],
          },
          {
            path: '/claim-submission/medisave',
            name: 'medisave',
            component: './ClaimSubmission/medisave',
            authority: ['claimsubmission'],
          },
          {
            path: '/claim-submission/medisave/invoice/:invoiceNo',
            name: 'patientInvoice',
            hideInMenu: true,
            component: './Finance/Invoice/Details',
            authority: ['claimsubmission'],
          },
        ],
      },
      // Claim Submission
      //
      // Forms
      {
        path: '/forms',
        icon: 'icon-pic-right',
        name: 'forms',
        moduleName: 'Forms',
        component: './FormListing',
        authority: ['forms'],
      },
      // Forms
      //
      // Settings
      {
        path: '/setting',
        icon: 'icon-setting',
        name: 'setting',
        moduleName: 'Settings',
        authority: ['settings'],
        specialist: ['GP', 'Dental'],
        hideChildrenInMenu: true,
        routes: [
          {
            path: '/setting',
            name: 'setting',
            component: './Setting',
            // hideInMenu: true,
            authority: ['settings'],
          },
          {
            path: '/setting/clinicinfo',
            name: 'clinicinfo',
            component: './Setting/ClinicInfo',
            authority: ['settings.mastersetting.clinicinformation'],
          },
          {
            path: '/setting/queuedisplaysetup',
            name: 'queuedisplaysetup',
            component: './Setting/QueueDisplaySetup',
          },
          {
            path: '/setting/service',
            name: 'service',
            component: './Setting/Service',
            authority: ['settings.clinicsetting.service'],
          },
          {
            path: '/setting/treatment',
            name: 'treatment',
            component: './Setting/Treatment',
            authority: ['settings'],
          },
          {
            path: '/setting/treatmentcategory',
            name: 'treatmentcategory',
            component: './Setting/TreatmentCategory',
            authority: ['settings'],
          },
          {
            path: '/setting/room',
            name: 'room',
            component: './Setting/Room',
            authority: ['settings.clinicsetting.room'],
          },
          {
            path: '/setting/roomassignment',
            name: 'roomassignment',
            component: './Setting/RoomAssignment',
            authority: ['settings.clinicsetting.roomassignment'],
          },
          {
            path: '/setting/clinicbreakhour',
            name: 'clinicbreakhour',
            component: './Setting/ClinicBreakHour',
            authority: ['settings.clinicsetting.clinicbreakhour'],
          },
          {
            path: '/setting/publicholiday',
            name: 'publicholiday',
            component: './Setting/PublicHoliday',
            authority: ['settings.clinicsetting.publicholiday'],
          },
          {
            path: '/setting/participantrole',
            name: 'participantrole',
            component: './Setting/ParticipantRole',
            authority: ['settings'],
          },
          {
            path: '/setting/roomblock',
            name: 'roomblock',
            component: './Setting/RoomBlock',
            authority: ['settings.clinicsetting.roomblock'],
          },
          {
            path: '/setting/doctorblock',
            name: 'doctorblock',
            component: './Setting/DoctorBlock',
            authority: ['settings.clinicsetting.doctorblock'],
          },
          {
            path: '/setting/userprofile',
            name: 'userprofile',
            component: './Setting/UserProfile',
            authority: ['settings'],
          },
          {
            path: '/setting/userprofile/new',
            name: 'newuserprofile',
            component: './Setting/UserProfile/Details',
            authority: ['settings'],
          },
          {
            path: '/setting/userprofile/:id',
            name: 'edituserprofile',
            component: './Setting/UserProfile/Details',
            authority: ['settings'],
          },
          {
            path: '/setting/userrole',
            name: 'userrole',
            component: './Setting/UserRole',
            authority: ['settings.role'],
          },
          {
            path: '/setting/userrole/new',
            name: 'newuserrole',
            component: './Setting/UserRole/Details',
            authority: ['settings.role.addrole'],
          },
          {
            path: '/setting/userrole/:id',
            name: 'edituserrole',
            component: './Setting/UserRole/Details',
            authority: ['settings.role.editrole'],
          },
          {
            path: '/setting/revenuecategory',
            name: 'revenuecategory',
            component: './Setting/RevenueCategory',
            authority: ['settings.clinicsetting.revenuecategory'],
          },
          {
            path: '/setting/consumableuom',
            name: 'consumableuom',
            component: './Setting/ConsumableUOM',
            authority: ['settings.clinicsetting.consumableuom'],
          },
          {
            path: '/setting/medicationUOM',
            name: 'medicationUOM',
            component: './Setting/MedicationUOM',
            authority: ['settings.clinicsetting.medicationuom'],
          },
          {
            path: '/setting/medicationgroup',
            name: 'medicationgroup',
            component: './Setting/MedicationGroup',
            authority: ['settings.clinicsetting.medicationgroup'],
          },
          {
            path: '/setting/consumablegroup',
            name: 'consumablegroup',
            component: './Setting/ConsumableGroup',
            authority: ['settings.clinicsetting.consumablecategory'],
          },
          {
            path: '/setting/medicationdosage',
            name: 'medicationdosage',
            component: './Setting/MedicationDosage',
            authority: ['settings.clinicsetting.medicationdosage'],
          },
          {
            path: '/setting/clinicoperationhour',
            name: 'clinicoperationhour',
            component: './Setting/ClinicOperationHour',
            authority: ['settings.clinicsetting.clinicoperationhour'],
          },
          {
            path: '/setting/gstsetup',
            name: 'gstsetup',
            component: './Setting/GST',
            authority: ['settings.mastersetting.gstsetup'],
          },
          {
            path: '/setting/generalsetting',
            name: 'generalsetting',
            component: './Setting/GeneralSetting',
            authority: ['settings.mastersetting.generalsetting'],
          },
          {
            path: '/setting/printoutsetting',
            name: 'printoutsetting',
            component: './Setting/PrintoutSetting',
            authority: ['settings.printsetup.printoutsetting'],
          },
          {
            path: '/setting/masterprintoutsetting',
            name: 'masterprintoutsetting',
            component: './Setting/MasterPrintoutSetting',
          },
          // {
          //   path: '/finance/company/1',
          //   name: 'copayer',
          //   component: './Setting/Company',
          // },
          {
            path: '/setting/company/2',
            name: 'supplier',
            component: './Setting/Company',
            authority: ['settings.contact.supplier'],
          },
          {
            path: '/setting/servicecenter',
            name: 'servicecenter',
            component: './Setting/serviceCenter',
            authority: ['settings.clinicsetting.servicecenter'],
          },
          {
            path: '/setting/servicecentercategory',
            name: 'servicecentercategory',
            component: './Setting/serviceCenterCategory',
            authority: ['settings.clinicsetting.servicecentercategory'],
          },
          {
            path: '/setting/servicecategory',
            name: 'servicecategory',
            component: './Setting/serviceCategory',
            authority: ['settings.clinicsetting.servicecategory'],
          },
          {
            path: '/setting/medicationfrequency',
            name: 'medicationfrequency',
            component: './Setting/medicationFrequency',
            authority: ['settings.clinicsetting.medicationfrequency'],
          },
          {
            path: '/setting/medicationprecautions',
            name: 'medicationprecautions',
            component: './Setting/medicationPrecautions',
            authority: ['settings.clinicsetting.medicationprecaution'],
          },
          {
            path: '/setting/medicationconsumptionmethod',
            name: 'medicationconsumptionmethod',
            component: './Setting/medicationConsumptionMethod',
            authority: ['settings.clinicsetting.medicationconsumptionmethod'],
          },
          {
            path: '/setting/smstemplate',
            name: 'smstemplate',
            component: './Setting/SMSTemplate',
            authority: ['settings.templates.smstemplate'],
          },
          {
            path: '/setting/documenttemplate',
            name: 'documenttemplate',
            component: './Setting/DocumentTemplate',
            authority: ['settings.templates.documenttemplate'],
          },
          {
            path: '/setting/paymentmode',
            name: 'paymentmode',
            component: './Setting/PaymentMode',
            authority: ['settings.clinicsetting.paymentmode'],
          },
          {
            path: '/setting/appointmenttype',
            name: 'appointmenttype',
            component: './Setting/AppointmentType',
            authority: ['settings.clinicsetting.appointmenttype'],
          },
          {
            path: '/setting/casetype',
            name: 'casetype',
            component: './Setting/CaseType',
            authority: ['settings.clinicsetting.casetype'],
          },
          {
            path: '/setting/casedescription',
            name: 'casedescription',
            component: './Setting/CaseDescription',
            authority: ['settings.clinicsetting.casedescription'],
          },
          {
            path: '/setting/referralsource',
            name: 'referralsource',
            component: './Setting/ReferralSource',
            authority: ['settings.contact.referralsource'],
          },
          {
            path: '/setting/referralperson',
            name: 'referralperson',
            component: './Setting/ReferralPerson',
            authority: ['settings.contact.referralperson'],
          },
          {
            path: '/setting/visitordertemplate',
            name: 'visitordertemplate',
            component: './Setting/VisitOrderTemplate',
            authority: ['settings.templates.visitordertemplate'],
          },
          {
            path: '/setting/refractiontesttype',
            name: 'refractiontesttype',
            component: './Setting/RefractionTestType',
            authority: ['settings.clinicsetting.refractiontesttype'],
          },
          {
            path: '/setting/package',
            name: 'package',
            component: './Setting/Package',
            authority: ['settings.clinicsetting.package'],
          },
          {
            path: '/setting/invoiceadjustment',
            name: 'invoiceadjustment',
            component: './Setting/InvoiceAdjustment',
            authority: ['settings.clinicsetting.invoiceadjustment'],
          },
        ],
      },
      // Settings
      //
      // AiOT
      // {
      //   path: '/patient-monitoring',
      //   icon: 'group',
      //   name: 'patient-monitoring',
      //   hideChildrenInMenu: true,
      //   routes: [
      //     {
      //       path: '/patient-monitoring',
      //       name: 'patient-monitoring',
      //       component: './PatientMonitoring',
      //     },
      //   ],
      // },
      // AiOT
      //
      // Support
      {
        path: '/support',
        icon: 'icon-phone',
        name: 'support',
        moduleName: 'Support',
        hideChildrenInMenu: true,
        specialist: ['GP', 'Dental'],
        routes: [
          {
            path: '/support',
            name: 'support',
            component: './Support',
          },
          {
            path: '/support/contactus',
            name: 'contactus',
            component: './support/teamviewer',
          },
          {
            path: '/support/printingtool',
            name: 'printingtool',
            component: './support/PrintingTool',
          },
          {
            path: '/support/queueprocessor',
            name: 'queueprocessor',
            component: './support/QueueProcessor',
          },
        ],
      },
      // Support
      //
      {
        hideInMenu: true,
        name: 'not-found',
        path: '/not-found',
        component: '404',
      },
      {
        hideInMenu: true,
        name: 'forbidden',
        path: '/forbidden',
        component: './Exception/403.js',
      },
    ],
  },
  // Main routes
  //
]

// const routes =
//   process.env.NODE_ENV === 'production'
//     ? _routes
//     : _routes.map((r, index) => {
//         return {
//           ...r,
//           routes: [devRoutes, ...r.routes],
//         }
//       })

export default _routes
