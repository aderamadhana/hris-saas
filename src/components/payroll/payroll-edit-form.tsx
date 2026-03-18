'use client'
 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { useToast } from '@/src/hooks/use-toast'
import { Loader2, Save, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from '@/src/lib/payroll/calculations'
 
interface PayrollEditFormProps {
  payroll: {
    id: string
    status: string
    allowances: number
    bonus: number
    otherDeductions: number
    notes: string | null
    baseSalary: number
    overtime: number
    bpjsKesehatan: number
    bpjsKetenagakerjaan: number
    pph21: number
  }
}
 
export function PayrollEditForm({ payroll }: PayrollEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
 
  // Form state
  const [formData, setFormData] = useState({
    allowances: payroll.allowances.toString(),
    bonus: payroll.bonus.toString(),
    otherDeductions: payroll.otherDeductions.toString(),
    notes: payroll.notes || '',
    status: payroll.status,
    paidDate: '',
  })
 
  const [errors, setErrors] = useState<Record<string, string>>({})
 
  // Calculate updated totals in real-time
  const calculateTotals = () => {
    const allowances = parseFloat(formData.allowances) || 0
    const bonus = parseFloat(formData.bonus) || 0
    const otherDeductions = parseFloat(formData.otherDeductions) || 0
 
    const grossSalary =
      payroll.baseSalary + allowances + payroll.overtime + bonus
 
    const totalDeductions =
      payroll.bpjsKesehatan +
      payroll.bpjsKetenagakerjaan +
      payroll.pph21 +
      otherDeductions
 
    const netSalary = grossSalary - totalDeductions
 
    return {
      grossSalary,
      totalDeductions,
      netSalary,
    }
  }
 
  const totals = calculateTotals()
 
  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {}
 
    const allowances = parseFloat(formData.allowances)
    const bonus = parseFloat(formData.bonus)
    const otherDeductions = parseFloat(formData.otherDeductions)
 
    if (isNaN(allowances) || allowances < 0) {
      newErrors.allowances = 'Allowances must be a positive number'
    }
    if (isNaN(bonus) || bonus < 0) {
      newErrors.bonus = 'Bonus must be a positive number'
    }
    if (isNaN(otherDeductions) || otherDeductions < 0) {
      newErrors.otherDeductions = 'Other deductions must be a positive number'
    }
 
    if (formData.status === 'paid' && !formData.paidDate) {
      newErrors.paidDate = 'Paid date is required when marking as paid'
    }
 
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
 
  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }
 
  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }
 
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
 
    if (!validate()) {
      return
    }
 
    setIsLoading(true)
 
    try {
      const response = await fetch(`/api/payroll/${payroll.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allowances: parseFloat(formData.allowances),
          bonus: parseFloat(formData.bonus),
          otherDeductions: parseFloat(formData.otherDeductions),
          notes: formData.notes || null,
          status: formData.status,
          paidDate: formData.paidDate || null,
        }),
      })
 
      const data = await response.json()
 
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payroll')
      }
 
      toast({
        title: 'Success',
        description: 'Payroll updated successfully',
      })
 
      router.refresh()
    } catch (error: any) {
      console.error('Update payroll error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payroll',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
 
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Editable Components */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Adjustments</h4>
 
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Allowances */}
          <div className="space-y-2">
            <Label htmlFor="allowances">
              Allowances (IDR)
            </Label>
            <Input
              id="allowances"
              name="allowances"
              type="number"
              min="0"
              step="1000"
              value={formData.allowances}
              onChange={handleChange}
              disabled={isLoading || payroll.status === 'paid'}
              className={errors.allowances ? 'border-red-500' : ''}
              placeholder="0"
            />
            {errors.allowances && (
              <p className="text-sm text-red-600">{errors.allowances}</p>
            )}
          </div>
 
          {/* Bonus */}
          <div className="space-y-2">
            <Label htmlFor="bonus">
              Bonus (IDR)
            </Label>
            <Input
              id="bonus"
              name="bonus"
              type="number"
              min="0"
              step="1000"
              value={formData.bonus}
              onChange={handleChange}
              disabled={isLoading || payroll.status === 'paid'}
              className={errors.bonus ? 'border-red-500' : ''}
              placeholder="0"
            />
            {errors.bonus && (
              <p className="text-sm text-red-600">{errors.bonus}</p>
            )}
          </div>
 
          {/* Other Deductions */}
          <div className="space-y-2">
            <Label htmlFor="otherDeductions">
              Other Deductions (IDR)
            </Label>
            <Input
              id="otherDeductions"
              name="otherDeductions"
              type="number"
              min="0"
              step="1000"
              value={formData.otherDeductions}
              onChange={handleChange}
              disabled={isLoading || payroll.status === 'paid'}
              className={errors.otherDeductions ? 'border-red-500' : ''}
              placeholder="0"
            />
            {errors.otherDeductions && (
              <p className="text-sm text-red-600">{errors.otherDeductions}</p>
            )}
          </div>
        </div>
      </div>
 
      {/* Updated Totals Preview */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">
          Updated Calculation Preview
        </h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-800">Gross Salary:</span>
            <span className="font-semibold text-blue-900">
              {formatCurrency(totals.grossSalary)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-800">Total Deductions:</span>
            <span className="font-semibold text-red-600">
              -{formatCurrency(totals.totalDeductions)}
            </span>
          </div>
          <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
            <span className="font-semibold text-blue-900">Net Salary:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(totals.netSalary)}
            </span>
          </div>
        </div>
      </div>
 
      {/* Status */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Status</h4>
 
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Status Select */}
          <div className="space-y-2">
            <Label htmlFor="status">Payroll Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-gray-500" />
                    <span>Draft</span>
                  </div>
                </SelectItem>
                <SelectItem value="approved">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Approved</span>
                  </div>
                </SelectItem>
                <SelectItem value="paid">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Paid</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
 
          {/* Paid Date (if status = paid) */}
          {formData.status === 'paid' && (
            <div className="space-y-2">
              <Label htmlFor="paidDate">
                Paid Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paidDate"
                name="paidDate"
                type="date"
                value={formData.paidDate}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.paidDate ? 'border-red-500' : ''}
              />
              {errors.paidDate && (
                <p className="text-sm text-red-600">{errors.paidDate}</p>
              )}
            </div>
          )}
        </div>
      </div>
 
      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Add any notes or comments about this payroll..."
        />
      </div>
 
      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading || payroll.status === 'paid'}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Saving...' : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
 
        {payroll.status === 'paid' && (
          <p className="text-sm text-gray-600">
            This payroll has been marked as paid and cannot be edited
          </p>
        )}
      </div>
    </form>
  )
}