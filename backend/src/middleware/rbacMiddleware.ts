import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { UserRole } from '../constants/index.js';

/**
 * RBAC Middleware: Verifies if the authenticated user has one of the allowed roles.
 * Admin automatically has super-user permission to access all modules.
 * Returns 403 Forbidden if user lacks required role.
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required before checking permissions.',
      });
      return;
    }

    const userRole = req.user.role as UserRole;

    // Admin has access to all executive endpoints
    if (userRole === UserRole.ADMIN) {
      next();
      return;
    }

    // Check if the user's role is in the allowed roles list
    if (allowedRoles.includes(userRole)) {
      next();
      return;
    }

    // Forbidden
    res.status(403).json({
      success: false,
      message: `Access denied. Role "${userRole}" is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}.`,
      userRole,
      allowedRoles,
    });
  };
};

/**
 * Middleware ensuring only Borrowers (or Admin) can access borrower-specific endpoints
 */
export const requireBorrower = requireRoles(UserRole.BORROWER);

/**
 * Middleware ensuring only Operations Executives (or Admin) can access dashboard
 */
export const requireExecutiveOrAdmin = requireRoles(
  UserRole.SALES,
  UserRole.SANCTION,
  UserRole.DISBURSEMENT,
  UserRole.COLLECTION,
  UserRole.ADMIN
);
