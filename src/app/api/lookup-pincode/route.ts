import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get("pincode");
  if (!pincode || pincode.length !== 6) {
    return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();

    if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return NextResponse.json({
        city: po.Name || po.District || "",
        state: po.State || "",
        district: po.District || "",
      });
    }

    return NextResponse.json({ city: "", state: "", district: "" });
  } catch {
    return NextResponse.json({ city: "", state: "", district: "" });
  }
}
