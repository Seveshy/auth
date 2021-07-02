import { useEffect } from "react";
import { api } from "../services/api";

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
