'use server';

import { DashboardService } from '@/services/database/dashboardService';

export async function getDashboardStats() {
  try {
    const stats = await DashboardService.getStats();
    return {
      success: true,
      data: {
        orders: {
          active: stats.orders
        },
        deliveries: {
          in_progress: stats.recentDeliveries
        },
        operators: {
          active: stats.operators
        },
        products: {
          total: stats.products
        },
        customers: {
          total: stats.customers
        },
        vehicles: {
          active: stats.vehicles
        }
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard statistics'
    };
  }
}

export async function getRecentActivity() {
  try {
    const activity = await DashboardService.getRecentActivity();
    return {
      success: true,
      data: activity
    };
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return {
      success: false,
      error: 'Failed to fetch recent activity'
    };
  }
}

export async function getDeliveryMetrics() {
  try {
    const metrics = await DashboardService.getDeliveryMetrics();
    return {
      success: true,
      data: metrics
    };
  } catch (error) {
    console.error('Error fetching delivery metrics:', error);
    return {
      success: false,
      error: 'Failed to fetch delivery metrics'
    };
  }
}

export async function getTopProducts() {
  try {
    const products = await DashboardService.getTopProducts();
    return {
      success: true,
      data: products
    };
  } catch (error) {
    console.error('Error fetching top products:', error);
    return {
      success: false,
      error: 'Failed to fetch top products'
    };
  }
}