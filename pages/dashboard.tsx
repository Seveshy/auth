import { useEffect } from "react";
import { setupApiClient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  useEffect(() => {
    api.get('/me')
    .then(response => console.log(response))
    .catch(err => console.log(err))
  }, [])

  return (
    <h1>Dashboard</h1>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupApiClient(ctx);
  const response = await api.get('/me');

  console.log(response.data);
  return {
    props: {}
  }
})
