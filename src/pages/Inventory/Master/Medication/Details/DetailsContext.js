import React, { useContext, useEffect, useState, createContext } from 'react'
import { useSelector } from 'dva'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

const DetailsContext = createContext(null)

export const DetailsContextProvider = props => {
  const { settings } = useSelector(state => state.clinicSettings)
  const context = { isMultilanguage: false }
  const [currentLanguage, setCurrentLanguage] = useState()
  const [languageLabel, setLanguageLabel] = useState()
  const [isMultiLanguage = false, setIsMultiLanguage] = useState()
  const [primaryPrintoutLanguage, setPrimaryPrintoutLanguage] = useState()
  const [secondaryPrintoutLanguage, setSecondaryPrintoutLanguage] = useState()
  const [isEditingDosageRule, setIsEditingDosageRule] = useState(false)

  useEffect(() => {
    const internalIsMultiLang =
      settings.primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
      settings.secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE

    setIsMultiLanguage(internalIsMultiLang)
    setCurrentLanguage(SYSTEM_LANGUAGE.PRIMARYLANGUAGE)
    setPrimaryPrintoutLanguage(SYSTEM_LANGUAGE.PRIMARYLANGUAGE)
    setSecondaryPrintoutLanguage(
      internalIsMultiLang ? SYSTEM_LANGUAGE.SECONDLANGUAGE : undefined,
    )
  }, [settings])

  useEffect(() => {
    setLanguageLabel(isMultiLanguage ? `(${currentLanguage})` : '')
  }, [currentLanguage])

  return (
    // this is the provider providing state
    <DetailsContext.Provider
      value={{
        isMultiLanguage,
        primaryPrintoutLanguage,
        secondaryPrintoutLanguage,
        isEditingDosageRule,
        setIsEditingDosageRule,
        currentLanguage,
        setCurrentLanguage,
        languageLabel,
      }}
    >
      {props.children}
    </DetailsContext.Provider>
  )
}

export default DetailsContext
