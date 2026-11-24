import * as mockApi from './mockApi'

/**
 * Single API facade used by pages.
 *
 * The first implementation ships with a local mock adapter so the whole buyer
 * flow is demoable without a server. Replace this object with REST-backed
 * functions once `server/` is running; page code should not import the mock
 * module directly.
 */
export const api = mockApi
export const CURRENT_USER_ID = mockApi.CURRENT_USER_ID
