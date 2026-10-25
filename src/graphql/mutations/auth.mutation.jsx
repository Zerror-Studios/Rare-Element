import { gql } from "@apollo/client";

// Refresh (PRD-001 phase 2): the refresh token is read from the HttpOnly
// customer cookie; only the new access token is selected.
export const CUSTOMER_REFRESH_TOKEN = gql`
  mutation CustomerRefreshToken {
    customerRefreshToken {
      accessToken
    }
  }
`;

// Logout: the server revokes the cookie session and expires the cookie.
export const CUSTOMER_LOGOUT = gql`
  mutation CustomerLogout {
    customerLogout
  }
`;

// Sign Up (duplicate email → extensions.code CONFLICT)
export const SIGN_UP_USER = gql`
  mutation CustomerSignup($input: CreateUserInput!) {
    customerSignup(input: $input) {
      _id
      firstName
      lastName
      email
      phoneNumber
      countryCode
      gender
      profileImg
      dateOfBirth
      status
      emailSubscribedStatus
    }
  }
`;

// Login: the refresh token is set as an HttpOnly cookie, never selected.
export const CUSTOMER_LOGIN = gql`
  mutation CustomerLogin($input: CustomerLoginInput!) {
    customerLogin(input: $input) {
      accessToken
      expiresIn
      customerId
    }
  }
`;

// Update Profile
export const UPDATE_USER_PROFILE = gql`
  mutation UpdateMyProfile($input: CreateUserInput!) {
    updateMyProfile(input: $input) {
      _id
      firstName
      lastName
      email
      phoneNumber
      countryCode
      gender
      profileImg
      dateOfBirth
      status
      emailSubscribedStatus
    }
  }
`;

// Password reset (PRD-003 FR-0.5): the request answers the same way for any
// email; the reset consumes the emailed token once.
export const CUSTOMER_REQUEST_PASSWORD_RESET = gql`
  mutation CustomerRequestPasswordReset($email: String!) {
    customerRequestPasswordReset(email: $email) {
      success
      message
    }
  }
`;

export const CUSTOMER_RESET_PASSWORD = gql`
  mutation CustomerResetPassword($token: String!, $newPassword: String!) {
    customerResetPassword(token: $token, newPassword: $newPassword)
  }
`;
