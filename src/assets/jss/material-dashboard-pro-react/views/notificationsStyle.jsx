// ##############################
// // // Notifications view styles
// #############################

import { defaultFont } from "mui-pro-jss"
import modalStyle from "mui-pro-jss/material-dashboard-pro-react/modalStyle.jsx"

const notificationsStyle = theme => ({
  cardTitle: {
    marginTop: "0",
    marginBottom: "3px",
    color: "#3C4858",
    fontSize: "18px",
  },
  cardHeader: {
    zIndex: "3",
  },
  cardSubtitle: {
    ...defaultFont,
    color: "#999999",
    fontSize: "14px",
    margin: "0 0 10px",
  },
  center: {
    textAlign: "center",
  },
  right: {
    textAlign: "right",
  },
  left: {
    textAlign: "left",
  },
  marginRight: {
    marginRight: "5px",
  },
  modalSectionTitle: {
    marginTop: "30px",
  },
  dialogPaper: {
      minHeight: '100vh',
      maxHeight: '100vh',
  },
  ...modalStyle(theme),
})

export default notificationsStyle
