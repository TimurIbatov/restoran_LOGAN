import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../contexts/ToastContext'

// Хук для работы с API запросами
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { showToast } = useToast()

  const {
    immediate = true,
    onSuccess,
    onError,
    showErrorToast = true,
    showSuccessToast = false
  } = options

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiFunction(...args)
      setData(result)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      if (showSuccessToast) {
        showToast('Успешно', 'Операция выполнена успешно', 'success')
      }
      
      return result
    } catch (err) {
      setError(err)
      
      if (onError) {
        onError(err)
      }
      
      if (showErrorToast) {
        showToast('Ошибка', err.message || 'Произошла ошибка', 'error')
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, onSuccess, onError, showErrorToast, showSuccessToast, showToast])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, dependencies)

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute
  }
}

// Хук для работы с пагинацией
export const usePagination = (apiFunction, options = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const {
    pageSize = 20,
    onSuccess,
    onError
  } = options

  const loadPage = useCallback(async (pageNumber = 1, reset = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page: pageNumber,
        page_size: pageSize
      }

      const result = await apiFunction(params)
      
      if (reset) {
        setData(result.results || [])
      } else {
        setData(prev => [...prev, ...(result.results || [])])
      }
      
      setTotal(result.count || 0)
      setHasMore(!!result.next)
      setPage(pageNumber)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err) {
      setError(err)
      
      if (onError) {
        onError(err)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, pageSize, onSuccess, onError])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPage(page + 1)
    }
  }, [loadPage, loading, hasMore, page])

  const refresh = useCallback(() => {
    loadPage(1, true)
  }, [loadPage])

  useEffect(() => {
    loadPage(1, true)
  }, [])

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    total,
    loadMore,
    refresh,
    loadPage
  }
}

// Хук для работы с формами
export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Очищаем ошибку при изменении значения
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }, [errors])

  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }))
  }, [])

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name]
    if (!rules) return null

    for (const rule of rules) {
      const error = rule(value, values)
      if (error) return error
    }
    
    return null
  }, [validationRules, values])

  const validateForm = useCallback(() => {
    const newErrors = {}
    
    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [validationRules, values, validateField])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value
    setValue(name, fieldValue)
  }, [setValue])

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target
    setFieldTouched(name, true)
    
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [setFieldTouched, validateField])

  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault()
      
      setIsSubmitting(true)
      
      // Отмечаем все поля как touched
      const allTouched = {}
      Object.keys(values).forEach(key => {
        allTouched[key] = true
      })
      setTouched(allTouched)
      
      // Валидируем форму
      const isValid = validateForm()
      
      if (isValid) {
        try {
          await onSubmit(values)
        } catch (error) {
          console.error('Form submission error:', error)
        }
      }
      
      setIsSubmitting(false)
    }
  }, [values, validateForm])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const isValid = Object.keys(errors).length === 0
  const hasErrors = Object.values(errors).some(error => error !== null)

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    hasErrors,
    setValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    reset
  }
}