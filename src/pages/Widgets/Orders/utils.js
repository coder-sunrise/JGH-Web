import { Divider } from '@material-ui/core'

const getCautionAlertContent = (cuationItems) => () => {
  return (
    <div
      style={{
        minHeight: 80,
        display: 'grid',
        alignItems: 'center',
      }}
    >
      <div style={{ margin: 5 }}>
        {cuationItems.length > 0 && (
          <div>
            <p>
              <h4
                style={{ fontWeight: 400, textAlign: 'left', marginBottom: 10 }}
              >
                Cautions
              </h4>
            </p>
          </div>
        )}
        {cuationItems.map((m) => (
          <div
            style={{
              display: 'flex',
              marginLeft: 20,
              marginTop: 5,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                width: 150,
                textAlign: 'left',
                display: 'inline-table',
              }}
            >
              <span>
                <b>{m.subject} - </b>
              </span>
            </div>
            <div style={{ textAlign: 'left' }}>{m.caution}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const getRetailCautionAlertContent = (
  cuationItems = [],
  ignoreVaccinationItems = [],
) => () => {
  return (
    <div
      style={{
        minHeight: 80,
        display: 'grid',
        alignItems: 'center',
      }}
    >
      <div style={{ margin: 5 }}>
        {cuationItems.length > 0 && (
          <div>
            <p>
              <h4 style={{ fontWeight: 400 }}>Cautions</h4>
            </p>
          </div>
        )}

        {cuationItems.map((m) => (
          <div
            style={{
              display: 'flex',
              marginLeft: 20,
              marginTop: 5,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                width: 150,
                textAlign: 'left',
                display: 'inline-table',
              }}
            >
              <span>
                <b>{m.subject} - </b>
              </span>
            </div>
            <div style={{ textAlign: 'left' }}>{m.caution}</div>
          </div>
        ))}
      </div>
      {ignoreVaccinationItems.length > 0 &&
      cuationItems.length > 0 && (
        <Divider light style={{ marginBottom: 10, marginTop: 10 }} />
      )}
      {ignoreVaccinationItems.length > 0 && (
        <div style={{ marginLeft: 5, marginRight: 5 }}>
          <p>
            <h4 style={{ fontWeight: 400 }}>
              Vaccination item(s) will not be added.
            </h4>
          </p>
          <div style={{ marginLeft: 20 }}>
            {ignoreVaccinationItems.map((item) => (
              <span>
                <b>{item.subject}</b>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const openCautionAlertPrompt = (cautionItems, onClose) => {
  window.g_app._store.dispatch({
    type: 'global/updateAppState',
    payload: {
      openConfirm: true,
      isInformType: true,
      openConfirmContent: getCautionAlertContent(cautionItems),
      openConfirmText: 'OK',
      onConfirmClose: onClose,
    },
  })
}

const openCautionAlertOnStartConsultation = (o) => {
  const { corPrescriptionItem = [], corVaccinationItem = [] } = o
  const drugItems = corPrescriptionItem
    .filter((i) => i.caution && i.caution.trim().length > 0)
    .map((m) => {
      return { subject: m.drugName, caution: m.caution }
    })
  const vaccinationItems = corVaccinationItem
    .filter((i) => i.caution && i.caution.trim().length > 0)
    .map((m) => {
      return { subject: m.vaccinationName, caution: m.caution }
    })
  const hasCautionItems = [
    ...drugItems,
    ...vaccinationItems,
  ]

  if (hasCautionItems.length > 0) {
    openCautionAlertPrompt(hasCautionItems)
  }
}

export {
  getCautionAlertContent,
  openCautionAlertPrompt,
  openCautionAlertOnStartConsultation,
  getRetailCautionAlertContent,
}
