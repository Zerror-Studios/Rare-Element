import { gql } from "@apollo/client";

export const REQUEST_BACK_IN_STOCK = gql`
  mutation RequestBackInStock($input: BackInStockInput!) {
    requestBackInStock(input: $input) {
      _id
    }
  }
`;
