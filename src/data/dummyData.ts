import { User } from '../contexts/AuthContext';
import { Department, Recommendation } from '../contexts/RecommendationsContext';

// Dummy departments
export const dummyDepartments: Department[] = [
  { id: 'd1', acronym: 'HR', name: 'Human Resources' },
  { id: 'd2', acronym: 'IT', name: 'Information Technology' },
  { id: 'd3', acronym: 'FIN', name: 'Finance' },
  { id: 'd4', acronym: 'MKT', name: 'Marketing' },
];

// Dummy users
export const dummyUsers: User[] = [
  {
    id: 'admin1',
    username: 'admin',
    password: 'admin123', // In a real app, you would never store passwords in plaintext
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: 'user1',
    username: 'john',
    password: 'john123',
    name: 'John Doe',
    role: 'user',
    departmentId: 'd1',
  },
  {
    id: 'user2',
    username: 'jane',
    password: 'jane123',
    name: 'Jane Smith',
    role: 'user',
    departmentId: 'd2',
  },
  {
    id: 'user3',
    username: 'alex',
    password: 'alex123',
    name: 'Alex Johnson',
    role: 'user',
    departmentId: 'd3',
  },
  {
    id: 'user4',
    username: 'sara',
    password: 'sara123',
    name: 'Sara Miller',
    role: 'user',
    departmentId: 'd4',
  },
];

// Get a date X days from now
const getDateFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Get a date X days ago
const getDateAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Dummy recommendations
export const dummyRecommendations: Recommendation[] = [
  {
    id: 'r1',
    title: 'Update employee handbook',
    description: 'Review and update the employee handbook with new remote work policies',
    userId: 'user1',
    createdBy: 'admin1',
    departmentId: 'd1',
    deadline: getDateFromNow(7),
    status: 'in_progress',
  },
  {
    id: 'r2',
    title: 'Security system update',
    description: 'Implement the new security patches on all development servers',
    userId: 'user2',
    createdBy: 'admin1',
    departmentId: 'd2',
    deadline: getDateFromNow(3),
    status: 'in_progress',
  },
  {
    id: 'r3',
    title: 'Financial report Q1',
    description: 'Prepare the Q1 financial report for the board meeting',
    userId: 'user3',
    createdBy: 'admin1',
    departmentId: 'd3',
    deadline: getDateFromNow(14),
    status: 'in_progress',
  },
  {
    id: 'r4',
    title: 'Marketing campaign plan',
    description: 'Develop a new marketing campaign for the upcoming product launch',
    userId: 'user4',
    createdBy: 'admin1',
    departmentId: 'd4',
    deadline: getDateFromNow(10),
    status: 'in_progress',
  },
  {
    id: 'r5',
    title: 'Staff training program',
    description: 'Create a training program for new hires in the HR department',
    userId: 'user1',
    createdBy: 'admin1',
    departmentId: 'd1',
    deadline: getDateAgo(5),
    status: 'overdue',
  },
  {
    id: 'r6',
    title: 'Update network infrastructure',
    description: 'Plan and execute the network infrastructure upgrade for the main office',
    userId: 'user2',
    createdBy: 'admin1',
    departmentId: 'd2',
    deadline: getDateAgo(2),
    status: 'completed',
    completedAt: getDateAgo(3),
  },
  {
    id: 'r7',
    title: 'Budget review',
    description: 'Review departmental budgets and suggest optimizations',
    userId: 'user3',
    createdBy: 'admin1',
    departmentId: 'd3',
    deadline: getDateFromNow(5),
    status: 'completed',
    completedAt: getDateAgo(1),
  },
  {
    id: 'r8',
    title: 'Social media strategy',
    description: 'Develop a social media strategy for Q2',
    userId: 'user4',
    createdBy: 'admin1',
    departmentId: 'd4',
    deadline: getDateFromNow(8),
    status: 'in_progress',
  },
];