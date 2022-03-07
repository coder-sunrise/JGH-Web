import React, { memo } from 'react'
import { Tooltip } from '@/components'

const DoctorLabel = ({ doctor, hideMCR = true }) => {
  let label = ''
  try {
    let { clinicianProfile, doctorMCRNo } = doctor
    if (clinicianProfile === undefined) clinicianProfile = doctor

    const title =
      clinicianProfile.title && clinicianProfile.title !== 'Other'
        ? `${clinicianProfile.title} `
        : ''
    let mcrNo = ''
    if (!hideMCR) {
      mcrNo = doctorMCRNo ? `(${doctorMCRNo})` : ''
      if (clinicianProfile.doctorProfile)
        mcrNo = `(${clinicianProfile.doctorProfile.doctorMCRNo})`
    }

    label = `${title}${clinicianProfile.name} ${mcrNo}`
  } catch (error) {
    // console.log({ error })
  }
  return <span>{label}</span>
}

export default memo(DoctorLabel)
