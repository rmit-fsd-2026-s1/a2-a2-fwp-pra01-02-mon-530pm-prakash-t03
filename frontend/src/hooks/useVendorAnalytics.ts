/**
 * VENUE VENDORS CLIENT APP - USEVENDORANALYTICS.TS
 * 
 * Purpose: Source code for Venue Vendors Client App.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Frontend Dev Server: npm run dev
 * - Build Frontend bundle: npm run build
 * - Run Frontend Unit Tests: npm test
 */

import { getApplications, getUsers } from '../utils/storage'

export function useVendorAnalytics() {
  const applications = getApplications()

  const users = getUsers().filter(user => user.role === 'hirer')

  const applicantMap: Record<
    string,
    {
      name: string
      selected: number
    }
  > = {}

  users.forEach(user => {
    applicantMap[user.id] = {
      name: user.name,
      selected: 0,
    }
  })

  applications.forEach(application => {
    if (
      application.status === 'approved' &&
      applicantMap[application.hirerId]
    ) {
      applicantMap[application.hirerId].selected += 1
    }
  })

  const analyticsData = Object.values(applicantMap).sort(
    (a, b) => b.selected - a.selected
  )

  const mostSelectedApplicants = analyticsData
    .filter(item => item.selected > 0)
    .slice(0, 3)

  const leastSelectedApplicants = [...analyticsData]
    .filter(item => item.selected > 0)
    .sort((a, b) => a.selected - b.selected)
    .slice(0, 3)

  const neverSelectedApplicants = analyticsData.filter(
    item => item.selected === 0
  )

  const chartColours = [
    '#1E3A8A',
    '#0EA5E9',
    '#10B981',
    '#8B5CF6',
    '#F59E0B',
    '#EF4444',
  ]

  const pieChartData = [
    ...analyticsData
      .filter(item => item.selected > 0)
      .map(item => ({
        name: item.name,
        value: item.selected,
      })),
    ...(neverSelectedApplicants.length > 0
      ? [
          {
            name: `Never Selected (${neverSelectedApplicants.length})`,
            value: 0.1,
          },
        ]
      : []),
  ]

  return {
    analyticsData,
    mostSelectedApplicants,
    leastSelectedApplicants,
    neverSelectedApplicants,
    chartColours,
    pieChartData,
  }
}