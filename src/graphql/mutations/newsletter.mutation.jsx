import { gql } from "@apollo/client";

// Newsletter unsubscribe link (PRD-002 VCON-1). The server answers `true`
// whatever the email or token, so the result reveals nothing.
export const UNSUBSCRIBE_NEWSLETTER = gql`
  mutation UnsubscribeNewsletter($email: String!, $token: String) {
    unsubscribeNewsletter(email: $email, token: $token)
  }
`;

// PRD-014 FR-2.8 (UX-29): footer sign-up. Only `_id` is selected, so the
// answer never echoes a stored name or status back to whoever typed the
// email.
export const SUBSCRIBE_NEWSLETTER = gql`
  mutation SubscribeNewsletter($email: String!, $name: String) {
    subscribeNewsletter(email: $email, name: $name) {
      _id
    }
  }
`;
