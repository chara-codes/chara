import type { RouteOptions, RouteMatch } from '../types/client.types';
import { logger } from '@chara/logger';

/**
 * RouteMatcher provides utilities for matching HTTP request paths against registered route patterns
 */
export class RouteMatcher {
  private routes: RouteOptions[] = [];

  /**
   * Add a route to the matcher
   */
  public addRoute(route: RouteOptions): void {
    // Validate that the route has either a handler or redirect configuration
    if (!route.handler && !route.redirect) {
      logger.error(`Route ${route.method || 'ALL'} ${route.url} is invalid: must provide either handler or redirect configuration`);
      throw new Error('Route must have either a handler or redirect configuration');
    }
    
    // Normalize URL to ensure consistent matching
    let normalizedUrl = route.url.replace(/\/+$/, '');
    if (!normalizedUrl.startsWith('/')) {
      normalizedUrl = '/' + normalizedUrl;
    }
    
    const routeConfig = {
      ...route,
      url: normalizedUrl,
      method: route.method ? route.method.toUpperCase() : 'ALL'
    };
    
    const hasOptionalParams = normalizedUrl.includes(':') && normalizedUrl.includes('?');
    const hasWildcardParams = normalizedUrl.includes(':') && normalizedUrl.includes('*');
    
    logger.debug(
      `Registering route: ${routeConfig.method === 'ALL' ? 'ALL METHODS' : routeConfig.method} ${routeConfig.url}${
        routeConfig.url.includes(':') 
          ? ` (with ${hasOptionalParams ? 'optional ' : ''}${hasWildcardParams ? 'wildcard ' : ''}parameters)`
          : ''
      }${routeConfig.redirect ? ' (redirect)' : ''}`
    );
    
    this.routes.push(routeConfig);
  }

  /**
   * Find a matching route for the given method and path
   */
  public findMatch(method: string, path: string): RouteMatch | null {
    const upperMethod = method.toUpperCase();
    
    // Sort routes by specificity - exact routes first, then routes with fewer parameters
    const sortedRoutes = [...this.routes]
      .filter(route => route.method === upperMethod || route.method === 'ALL')
      .sort((a, b) => {
        // First prioritize exact method matches over ALL matches
        if (a.method === upperMethod && b.method === 'ALL') return -1;
        if (a.method === 'ALL' && b.method === upperMethod) return 1;
        
        // Then sort by parameter count
        const aParamCount = (a.url.match(/:[^\/]+/g) || []).length;
        const bParamCount = (b.url.match(/:[^\/]+/g) || []).length;
        return aParamCount - bParamCount;
      });
    
    for (const route of sortedRoutes) {
      // Check if route matches and extract params
      const params = this.matchPath(route.url, path);
      if (params !== null) {
        return { route, params };
      }
    }
    
    return null;
  }

  /**
   * Check if a route segment is an optional parameter (ends with ?)
   */
  private isOptionalParam(segment: string): boolean {
    return segment.startsWith(':') && segment.endsWith('?');
  }

  /**
   * Check if a route segment is a wildcard parameter (ends with *)
   */
  private isWildcardParam(segment: string): boolean {
    return segment.startsWith(':') && segment.endsWith('*');
  }

  /**
   * Extract parameter name from a route segment
   */
  private extractParamName(segment: string): string {
    if (this.isOptionalParam(segment)) {
      return segment.slice(1, -1); // Remove : and ?
    }
    if (this.isWildcardParam(segment)) {
      return segment.slice(1, -1); // Remove : and *
    }
    return segment.slice(1); // Remove just :
  }

  /**
   * Match a route pattern against an actual path and extract parameters
   * Handles patterns like:
   * - /users/:id/profile - standard parameter
   * - /users/:id? - optional parameter
   * - /files/:path* - wildcard parameter (captures remaining path)
   */
  public matchPath(pattern: string, path: string): Record<string, string> | null {
    // Extract pathname from URL if full URL is provided
    if (path.includes('://')) {
      try {
        const url = new URL(path);
        path = url.pathname;
      } catch (e) {
        // Keep original path if URL parsing fails
      }
    }
    
    // Split both pattern and path into segments
    const patternSegments = pattern.split('/').filter(segment => segment.length > 0);
    const pathSegments = path.split('/').filter(segment => segment.length > 0);
    
    // Count required segments (non-optional)
    const requiredSegments = patternSegments.filter(
      segment => !segment || (!this.isOptionalParam(segment) && !this.isWildcardParam(segment))
    ).length;
    
    // If there aren't enough path segments to match required pattern segments, no match
    if (pathSegments.length < requiredSegments) {
      return null;
    }
    
    // If there are too many path segments and no wildcard, no match
    const hasWildcard = patternSegments.some(segment => segment && this.isWildcardParam(segment));
    if (pathSegments.length > patternSegments.length && !hasWildcard) {
      return null;
    }
    
    const params: Record<string, string> = {};
    let pathIndex = 0;
    
    // Check each segment
    for (let i = 0; i < patternSegments.length; i++) {
      const patternSegment = patternSegments[i];
      if (!patternSegment) continue;
      
      // If we've gone through all path segments
      if (pathIndex >= pathSegments.length) {
        // If this is an optional parameter, it's fine to be missing
        if (this.isOptionalParam(patternSegment)) {
          params[this.extractParamName(patternSegment)] = '';
          continue;
        }
        // If it's a wildcard at the end, it can match empty string
        if (this.isWildcardParam(patternSegment)) {
          params[this.extractParamName(patternSegment)] = '';
          continue;
        }
        // Otherwise, required segment is missing
        return null;
      }
      
      // Get current path segment
      const pathSegment = pathSegments[pathIndex];
      
      // Handle parameter segments
      if (patternSegment.startsWith(':')) {
        const paramName = this.extractParamName(patternSegment);
        
        // Wildcard parameter - captures rest of path
        if (this.isWildcardParam(patternSegment)) {
          const remainingPathSegments = pathSegments.slice(pathIndex);
          params[paramName] = remainingPathSegments.join('/');
          pathIndex = pathSegments.length; // Move to end
          continue;
        }
        
        // Regular parameter - store its value and advance path index
        params[paramName] = pathSegment || '';
        pathIndex++;
        continue;
      }
      
      // Static segment - must match exactly
      if (patternSegment !== pathSegment) {
        return null;
      }
      
      // Move to next path segment
      pathIndex++;
    }
    
    // If we didn't consume all path segments, it's not a match 
    // (unless we had a wildcard parameter which would have consumed all remaining segments)
    if (pathIndex < pathSegments.length) {
      return null;
    }
    
    return params;
  }

  /**
   * Get all registered routes
   */
  public getRoutes(): RouteOptions[] {
    return [...this.routes];
  }

  /**
   * Clear all registered routes
   */
  public clearRoutes(): void {
    this.routes = [];
  }
}