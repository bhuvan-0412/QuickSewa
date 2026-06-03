import ReportClient from "./ReportClient";

export async function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function Page() {
  return <ReportClient />;
}
