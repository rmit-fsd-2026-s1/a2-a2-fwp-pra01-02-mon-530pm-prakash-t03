/**
 * Unit Tests for Venue Vendors
 * 
 * These tests cover:
 *   1. Form validation utilities (validation.ts)
 *   2. StarRating component render + interaction
 *   3. localStorage storage utilities (storage.ts)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Test 1: Validation Utilities
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateDate,
  validateABN,
} from '../utils/validation'

describe('Validation Utilities', () => {
  // Email validation
  describe('validateEmail', () => {
    it('returns null for a valid email address', () => {
      expect(validateEmail('user@example.com')).toBeNull()
      expect(validateEmail('first.last@domain.org')).toBeNull()
    })

    it('returns an error message for an empty email', () => {
      const result = validateEmail('')
      expect(result).not.toBeNull()
      expect(result).toMatch(/required/i)
    })

    it('returns an error for an email missing the @ symbol', () => {
      expect(validateEmail('notanemail.com')).not.toBeNull()
    })

    it('returns an error for an email missing a TLD', () => {
      expect(validateEmail('user@domain')).not.toBeNull()
    })
  })

  // Password validation
  describe('validatePassword', () => {
    it('returns null for a valid strong password', () => {
      expect(validatePassword('StrongPass1!')).toBeNull()
    })

    it('returns an error for a password shorter than 8 characters', () => {
      const result = validatePassword('Ab1!')
      expect(result).not.toBeNull()
      expect(result).toMatch(/8 characters/i)
    })

    it('returns an error for a password missing an uppercase letter', () => {
      expect(validatePassword('lowercase1!')).not.toBeNull()
    })

    it('returns an error for a password missing a number', () => {
      expect(validatePassword('NoNumbers!!')).not.toBeNull()
    })

    it('returns an error for a password missing a special character', () => {
      expect(validatePassword('NoSpecial1')).not.toBeNull()
    })
  })

  // Phone validation
  describe('validatePhone', () => {
    it('accepts valid Australian mobile numbers', () => {
      expect(validatePhone('0412345678')).toBeNull()
      expect(validatePhone('0499 999 999')).toBeNull()
    })

    it('rejects an empty phone number', () => {
      expect(validatePhone('')).not.toBeNull()
    })

    it('rejects a phone number that is too short', () => {
      expect(validatePhone('04123')).not.toBeNull()
    })
  })

  // Date validation
  describe('validateDate', () => {
    it('returns an error for an empty date', () => {
      expect(validateDate('')).not.toBeNull()
    })

    it('returns an error for a past date', () => {
      expect(validateDate('2000-01-01')).not.toBeNull()
    })

    it('returns null for a future date', () => {
      const future = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
      expect(validateDate(future)).toBeNull()
    })
  })

  // ABN validation
  describe('validateABN', () => {
    it('accepts a valid 11-digit ABN', () => {
      expect(validateABN('12345678901')).toBeNull()
      expect(validateABN('12 345 678 901')).toBeNull()
    })

    it('rejects ABN with fewer than 11 digits', () => {
      expect(validateABN('1234567890')).not.toBeNull()
    })

    it('rejects non-numeric ABN input', () => {
      expect(validateABN('ABCDEFGHIJK')).not.toBeNull()
    })
  })
})


// Test 2: StarRating Component
import StarRating from '../components/StarRating'

describe('StarRating Component', () => {
  it('renders the correct number of stars (default max=5)', () => {
    render(<StarRating value={3} readOnly />)
    const stars = screen.getAllByText('★')
    expect(stars).toHaveLength(5)
  })

  it('renders the correct number of filled stars', () => {
    render(<StarRating value={4} readOnly />)
    const filled = document.querySelectorAll('.star.filled')
    expect(filled).toHaveLength(4)
  })

  it('renders zero filled stars when value is 0', () => {
    render(<StarRating value={0} readOnly />)
    const filled = document.querySelectorAll('.star.filled')
    expect(filled).toHaveLength(0)
  })

  it('renders with a custom max value', () => {
    render(<StarRating value={2} max={10} readOnly />)
    const stars = screen.getAllByText('★')
    expect(stars).toHaveLength(10)
  })

  it('calls onChange when a star is clicked in interactive mode', async () => {
    const handleChange = vi.fn()
    render(<StarRating value={1} onChange={handleChange} />)
    const stars = screen.getAllByRole('button')
    await userEvent.click(stars[3]) // click 4th star
    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('does NOT call onChange when readOnly is set', async () => {
    const handleChange = vi.fn()
    render(<StarRating value={3} readOnly onChange={handleChange} />)
    const stars = screen.getAllByText('★')
    await userEvent.click(stars[0])
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('has correct aria-label for accessibility', () => {
    render(<StarRating value={3} max={5} readOnly />)
    expect(screen.getByLabelText('3 out of 5 stars')).toBeTruthy()
  })

  it('applies correct filled/unfilled class count for partial rating', () => {
    render(<StarRating value={2} readOnly />)
    const filledStars = document.querySelectorAll('.star.filled')
    const emptyStars  = document.querySelectorAll('.star:not(.filled)')
    expect(filledStars).toHaveLength(2)
    expect(emptyStars).toHaveLength(3)
  })
})


// Test 3: localStorage Storage Utilities
import {
  getUsers, saveUsers, addUser, getUserByEmail, updateUser,
  getVenues, addVenue, updateVenue,
  getCurrentUserId, setCurrentUserId, clearCurrentUser,
  calcCredibilityScore, getHirerReputation,
  addHireHistory, getHireHistoryByHirer,
  uid,
} from '../utils/storage'
import type { User, Venue, HireHistory } from '../types'

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // Users
  describe('User storage', () => {
    it('returns an empty array when no users are stored', () => {
      expect(getUsers()).toEqual([])
    })

    it('can save and retrieve a list of users', () => {
      const users: User[] = [
        { id: 'u1', email: 'a@b.com', password: 'pw', role: 'hirer', name: 'Alice', phone: '0400000001', createdAt: '' },
      ]
      saveUsers(users)
      expect(getUsers()).toEqual(users)
    })

    it('adds a user to the existing list', () => {
      const u1: User = { id: 'u1', email: 'a@b.com', password: 'pw', role: 'hirer', name: 'Alice', phone: '0400000001', createdAt: '' }
      const u2: User = { id: 'u2', email: 'b@c.com', password: 'pw', role: 'vendor', name: 'Bob', phone: '0400000002', createdAt: '' }
      addUser(u1)
      addUser(u2)
      expect(getUsers()).toHaveLength(2)
    })

    it('finds a user by email (case-insensitive)', () => {
      const u: User = { id: 'u1', email: 'Alice@Test.com', password: 'pw', role: 'hirer', name: 'Alice', phone: '04', createdAt: '' }
      addUser(u)
      expect(getUserByEmail('alice@test.com')).toEqual(u)
    })

    it('updates an existing user', () => {
      const u: User = { id: 'u1', email: 'a@b.com', password: 'pw', role: 'hirer', name: 'Alice', phone: '04', createdAt: '' }
      addUser(u)
      updateUser({ ...u, name: 'Alice Updated' })
      expect(getUsers()[0].name).toBe('Alice Updated')
    })
  })

  // Session
  describe('Session management', () => {
    it('returns null when no user is logged in', () => {
      expect(getCurrentUserId()).toBeNull()
    })

    it('sets and retrieves the current user ID', () => {
      setCurrentUserId('user-123')
      expect(getCurrentUserId()).toBe('user-123')
    })

    it('clears the current user', () => {
      setCurrentUserId('user-123')
      clearCurrentUser()
      expect(getCurrentUserId()).toBeNull()
    })
  })

  // Venues
  describe('Venue storage', () => {
    it('saves and retrieves venues', () => {
      const v: Venue = {
        id: 'v1', vendorId: 'vd1', name: 'Hall A', location: 'CBD',
        capacity: 100, suitability: ['Weddings'], description: 'Nice hall',
        imageUrl: '', pricePerHour: 500, isBlocked: false,
      }
      addVenue(v)
      expect(getVenues()).toHaveLength(1)
    })

    it('updates a venue correctly', () => {
      const v: Venue = {
        id: 'v1', vendorId: 'vd1', name: 'Hall A', location: 'CBD',
        capacity: 100, suitability: [], description: '',
        imageUrl: '', pricePerHour: 500, isBlocked: false,
      }
      addVenue(v)
      updateVenue({ ...v, isBlocked: true, blockReason: 'Maintenance' })
      expect(getVenues()[0].isBlocked).toBe(true)
      expect(getVenues()[0].blockReason).toBe('Maintenance')
    })
  })

  // Hire history & reputation
  describe('Hire history and reputation', () => {
    it('returns 0 reputation for a hirer with no history', () => {
      expect(getHirerReputation('unknown-id')).toBe(0)
    })

    it('calculates average reputation from hire history', () => {
      const makeHistory = (id: string, rating: number): HireHistory => ({
        id, hirerId: 'hirer-1', hirerName: 'Alice', vendorId: 'v1',
        venueId: 'venue-1', venueName: 'Hall', venueLocation: 'CBD',
        eventName: 'Event', dateOfHire: '2024-01-01', rating,
      })
      addHireHistory(makeHistory('h1', 4))
      addHireHistory(makeHistory('h2', 2))
      // Average = (4+2)/2 = 3.0
      expect(getHirerReputation('hirer-1')).toBe(3.0)
    })

    it('retrieves hire history for a specific hirer', () => {
      const entry: HireHistory = {
        id: 'h1', hirerId: 'hirer-2', hirerName: 'Bob', vendorId: 'v1',
        venueId: 'venue-2', venueName: 'Loft', venueLocation: 'Brunswick',
        eventName: 'Party', dateOfHire: '2024-06-01', rating: 5,
      }
      addHireHistory(entry)
      const result = getHireHistoryByHirer('hirer-2')
      expect(result).toHaveLength(1)
      expect(result[0].rating).toBe(5)
    })
  })

  // Credibility score
describe('calcCredibilityScore', () => {
  const validPdfFile = 'data:application/pdf;base64,' + 'A'.repeat(150)
  const validImageFile = 'data:image/jpeg;base64,' + 'A'.repeat(150)

  it('returns 0 when no documents are provided', () => {
    expect(calcCredibilityScore({ isBusinessApplicant: false })).toBe(0)
  })

  it('returns 2.5 when only driver license is provided (non-business, 2 docs total)', () => {
    const score = calcCredibilityScore({
      isBusinessApplicant: false,
      driverLicenseName: 'license.jpg',
      driverLicenseData: validImageFile,
    })
    expect(score).toBe(2.5)
  })

  it('returns 5.0 when all non-business documents are provided', () => {
    const score = calcCredibilityScore({
      isBusinessApplicant: false,
      driverLicenseName: 'license.jpg',
      driverLicenseData: validImageFile,
      publicLiabilityName: 'liability.pdf',
      publicLiabilityData: validPdfFile,
    })
    expect(score).toBe(5)
  })

  it('returns proportional score for business applicants with all 3 documents', () => {
    const score = calcCredibilityScore({
      isBusinessApplicant: true,
      driverLicenseName: 'license.jpg',
      driverLicenseData: validImageFile,
      publicLiabilityName: 'liability.pdf',
      publicLiabilityData: validPdfFile,
      businessCertName: 'business.pdf',
      businessCertData: validPdfFile,
    })
    expect(score).toBe(5)
  })

  it('returns partial score for business applicant with 2 of 3 documents', () => {
    const score = calcCredibilityScore({
      isBusinessApplicant: true,
      driverLicenseName: 'license.jpg',
      driverLicenseData: validImageFile,
      publicLiabilityName: 'liability.pdf',
      publicLiabilityData: validPdfFile,
    })

    expect(score).toBeGreaterThan(3)
    expect(score).toBeLessThan(4)
  })

  it('returns 0 for invalid or too-small uploaded document data', () => {
    const score = calcCredibilityScore({
      isBusinessApplicant: false,
      driverLicenseName: 'license.jpg',
      driverLicenseData: 'data:image/jpeg;base64,FAKE',
    })

    expect(score).toBe(0)
  })
})

  // uid generator
  describe('uid()', () => {
    it('generates unique IDs each call', () => {
      const ids = Array.from({ length: 100 }, () => uid())
      const unique = new Set(ids)
      expect(unique.size).toBe(100)
    })

    it('generates non-empty string IDs', () => {
      const id = uid()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })
})
