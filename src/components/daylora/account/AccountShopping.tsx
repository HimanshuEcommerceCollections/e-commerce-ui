"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import shoppingService from "@/services/account/shopping.service";
import savedItemsService from "@/services/account/savedItems.service";
import { useCartStore } from "@/store/useCartStore";
import { useSavedItemsStore } from "@/hooks/useSavedItems";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import type { BuyAgainItem, CustomerReturn, MyReview, MyReviews, PendingReview, SavedItem } from "@/types/api/shopping.types";
import { Thumb, fmtDay, fmtLong, fmtShort, money, useAccountToast, variantText } from "./customerShared";
import { EmptyBox, ViewHead, useAccountShell, useGoLink } from "./accountShell";
import { orderHref, productHref } from "./AccountOrders";
import { QrCode } from "./qr";

const statusCode = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

/** Loading / error states shared by the list views. */
function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setError(null);
    load()
      .then((d) => live && setData(d))
      .catch((e) => live && setError(getApiErrorMessage(e, "We couldn't load this section.")));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  return { data, setData, error, reload: useCallback(() => setTick((n) => n + 1), []) };
}

function Loading({ error, retry, label }: { error: string | null; retry: () => void; label: string }) {
  if (error) {
    return (
      <div className="alert err" role="alert">
        <DayloraIcon name="alert" />
        <span>
          {error}{" "}
          <button type="button" className="link inline" onClick={retry}>
            Try again
          </button>
        </span>
      </div>
    );
  }
  return (
    <>
      <div className="skel" style={{ height: 240 }} aria-hidden="true" />
      <span className="sr-only" role="status">
        {label}
      </span>
    </>
  );
}

/** Price with the list price struck through when it's higher. */
function Price({ price, mrp }: { price: number; mrp: number | null }) {
  return (
    <span className="pr">
      {money(price)}
      {mrp && mrp > price ? <s>{money(mrp)}</s> : null}
    </span>
  );
}

/* ===========================================================================
   Returns & refunds
   =========================================================================== */

const RETURN_STEPS = ["Started", "Dropped off", "Received", "Refunded"];

export function ReturnsView() {
  const config = useStoreConfig();
  const goLink = useGoLink();
  const { data, error, reload } = useLoad(() =>
    shoppingService.getReturns({ size: 50 }).then((r) => r.data.data?.content ?? [])
  );
  const days = config?.returnWindowDays ?? 30;

  return (
    <>
      <ViewHead
        title="Returns & refunds"
        sub="Track returns and exchanges you've started."
        right={
          <Link className="btn btn-primary" {...goLink("orders")}>
            Start a return
          </Link>
        }
      />
      {!data ? (
        <Loading error={error} retry={reload} label="Loading your returns" />
      ) : data.length === 0 ? (
        <EmptyBox
          icon="return"
          title="No returns yet"
          text={`Changed your mind? Most items can be returned or exchanged free within ${days} days.`}
        >
          <Link className="btn btn-primary" {...goLink("orders")}>
            Start a return
          </Link>
        </EmptyBox>
      ) : (
        data.map((r) => <ReturnCard key={r.id} r={r} />)
      )}
      <section className="card policy-card">
        <h2>Return policy</h2>
        <p className="note-sm policy">
          Free returns and exchanges within {days} days of delivery. Refunds arrive 5–7 business days after we receive
          your return.{" "}
          <Link className="link inline" href="/help?t=returns">
            See the full policy
          </Link>
        </p>
      </section>
    </>
  );
}

function ReturnCard({ r }: { r: CustomerReturn }) {
  const rejected = r.status === "REJECTED";
  const done = r.step >= 3 || r.status === "REFUNDED";
  const active = !done && !rejected;
  const pickup = r.method === "PICKUP";
  const steps = pickup ? ["Started", "Picked up", "Received", "Refunded"] : RETURN_STEPS;
  const refund = r.refundAmount ?? r.estimatedRefund;
  const to = r.refundTo === "STORE_CREDIT" ? "store credit" : "original payment";
  const carrier = r.carrier || "UPS";
  const pkWindow = r.pickupWindow || "9 AM – 7 PM";

  return (
    <article className="rcard" aria-label={`Return ${r.rmaNumber}`}>
      <div className="rc-top">
        <div>
          <b>
            Return <span className="mono">{r.rmaNumber}</span>
          </b>
          <small>
            Order {r.orderNumber} · started {fmtLong(r.createdAt)}
          </small>
        </div>
        <span className={`pill ${active ? "info" : rejected ? "grey" : "ok"}`}>
          {rejected ? "Not accepted" : active ? steps[r.step] : steps[3]}
        </span>
      </div>
      <div className="rc-body">
        <div>
          {!rejected && (
            <ol className="rsteps" aria-label="Return progress">
              {steps.map((s, i) => (
                <li key={s} className={i <= r.step ? "on" : undefined}>
                  {s}
                </li>
              ))}
            </ol>
          )}
          <div className="oc-items flush">
            {r.items.map((i) => (
              <div className="oc-item" key={i.orderItemId}>
                <Thumb src={i.imageUrl} />
                <span>
                  <b>{i.productName}</b>
                  <span>
                    {variantText(i) ? `${variantText(i)} · ` : ""}Refund {money(i.amount)}
                    {i.quantity > 1 ? ` · Qty ${i.quantity}` : ""}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="note-sm" style={{ marginTop: 12 }}>
            {rejected
              ? "This return wasn't accepted. Contact us if you have questions."
              : done
                ? `Refunded ${money(refund)} to your ${to}${r.refundedAt ? ` on ${fmtShort(r.refundedAt)}` : ""}.`
                : r.step === 0
                  ? `${
                      pickup
                        ? `${carrier} pickup is scheduled${r.pickupDate ? ` for ${fmtDay(r.pickupDate)}, ${pkWindow}` : ""}.`
                        : `Drop it off at any ${carrier} location with the QR code${r.dropoffBy ? ` by ${fmtShort(r.dropoffBy)}` : ""}.`
                    } Refund ${money(refund)} ${r.refundTo === "STORE_CREDIT" ? "as store credit" : "to your original payment"}.`
                  : "We'll email you when your refund is issued."}
          </p>
        </div>
        <div className="rc-side">
          {active && r.step === 0 && !pickup && r.dropoffCode && (
            <>
              <QrCode value={r.dropoffCode} label={`Return QR code ${r.dropoffCode}`} />
              <small className="note-sm">Show at {carrier}</small>
            </>
          )}
          <Link className="btn btn-secondary btn-sm" href={orderHref(r)}>
            View order
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ===========================================================================
   Buy again
   =========================================================================== */

export function BuyAgainView() {
  const toast = useAccountToast();
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const [adding, setAdding] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const { data, setData, error, reload } = useLoad(() =>
    shoppingService.getBuyAgain({ size: 24, page: 0 }).then((r) => {
      setMore((r.data.data?.totalPages ?? 1) > 1);
      setPage(0);
      return r.data.data?.content ?? [];
    })
  );

  async function loadMore() {
    try {
      const r = await shoppingService.getBuyAgain({ size: 24, page: page + 1 });
      const d = r.data.data;
      setData((l) => [...(l ?? []), ...(d?.content ?? [])]);
      setPage((p) => p + 1);
      setMore(!!d && d.number + 1 < d.totalPages);
    } catch (e) {
      toast({ title: "Couldn't load more", body: getApiErrorMessage(e, "Try again in a moment.") });
    }
  }

  async function addOne(x: BuyAgainItem) {
    setAdding(x.productId);
    try {
      await add(x.productId, 1);
      toast({ title: "Added to cart", body: x.name, action: { label: "View cart", onClick: () => router.push("/cart") } });
    } catch (e) {
      toast({ title: "Couldn't add this item", body: getApiErrorMessage(e, "It's out of stock or no longer sold.") });
    } finally {
      setAdding(null);
    }
  }

  return (
    <>
      <ViewHead title="Buy again" sub="Things you've ordered before." />
      {!data ? (
        <Loading error={error} retry={reload} label="Loading things you've ordered" />
      ) : data.length === 0 ? (
        <EmptyBox icon="cart" title="Nothing to buy again yet" text="Items from your delivered orders show up here.">
          <Link className="btn btn-primary" href="/">
            Start shopping
          </Link>
        </EmptyBox>
      ) : (
        <>
          <div className="pgrid">
            {data.map((x) => {
              const v = variantText(x);
              const out = x.stock <= 0;
              return (
                <div className="pc" key={x.productId}>
                  <Link href={productHref(x)} tabIndex={-1} aria-hidden="true">
                    <Thumb src={x.imageUrl} />
                  </Link>
                  <Link href={productHref(x)}>
                    <b>{x.name}</b>
                  </Link>
                  <Price price={x.price} mrp={x.mrp} />
                  <small>
                    Last bought {fmtShort(x.lastBoughtAt)}
                    {v ? ` · ${v}` : ""}
                  </small>
                  {out && <small className="oos">Out of stock</small>}
                  <button type="button" className="btn btn-primary" disabled={out || adding === x.productId} onClick={() => addOne(x)}>
                    {adding === x.productId ? "Adding…" : "Add to cart"}
                  </button>
                </div>
              );
            })}
          </div>
          {more && (
            <button type="button" className="btn btn-secondary" style={{ alignSelf: "center" }} onClick={loadMore}>
              Show more
            </button>
          )}
        </>
      )}
    </>
  );
}

/* ===========================================================================
   Saved items
   =========================================================================== */

export function SavedView() {
  const toast = useAccountToast();
  const router = useRouter();
  const { refreshSummary } = useAccountShell();
  const toggle = useSavedItemsStore((s) => s.toggle);
  const drop = useSavedItemsStore((s) => s.drop);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, setData, error, reload } = useLoad(() => savedItemsService.list().then((r) => r.data.data ?? []));

  const without = (id: string) => setData((l) => (l ?? []).filter((x) => x.productId !== id));

  async function moveToCart(x: SavedItem) {
    setBusy(x.productId);
    try {
      const r = await savedItemsService.moveToCart(x.productId);
      if (r.data.data) useCartStore.setState({ cart: r.data.data });
      else void useCartStore.getState().refresh();
      without(x.productId);
      drop(x.productId);
      refreshSummary();
      toast({ title: "Moved to cart", body: x.name, action: { label: "View cart", onClick: () => router.push("/cart") } });
    } catch (e) {
      toast({ title: "Couldn't move this item", body: getApiErrorMessage(e, "It may be out of stock.") });
    } finally {
      setBusy(null);
    }
  }

  async function remove(x: SavedItem) {
    setBusy(x.productId);
    try {
      await toggle(x.productId);
      without(x.productId);
      refreshSummary();
      toast({
        title: "Removed",
        body: x.name,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await toggle(x.productId);
              reload();
              refreshSummary();
            } catch {
              /* the item stays removed */
            }
          },
        },
      });
    } catch (e) {
      toast({ title: "Couldn't remove this item", body: getApiErrorMessage(e, "Try again in a moment.") });
    } finally {
      setBusy(null);
    }
  }

  const n = data?.length ?? 0;
  return (
    <>
      <ViewHead title="Saved items" sub={data ? `${n} item${n === 1 ? "" : "s"} · we'll email you if the price drops` : undefined} />
      {!data ? (
        <Loading error={error} retry={reload} label="Loading your saved items" />
      ) : n === 0 ? (
        <EmptyBox icon="heart" title="No saved items" text="Tap the heart on any product to save it for later.">
          <Link className="btn btn-primary" href="/">
            Browse products
          </Link>
        </EmptyBox>
      ) : (
        <div className="pgrid">
          {data.map((x) => {
            const out = x.stock <= 0;
            return (
              <div className="pc" key={x.productId}>
                <Link href={productHref(x)} tabIndex={-1} aria-hidden="true">
                  <Thumb src={x.imageUrl} />
                </Link>
                <Link href={productHref(x)}>
                  <b>{x.name}</b>
                </Link>
                <Price price={x.price} mrp={x.mrp} />
                {x.priceDrop > 0 ? (
                  <span className="drop">
                    <DayloraIcon name="tag" />
                    Price dropped {money(x.priceDrop)}
                  </span>
                ) : (
                  <small>Saved {fmtShort(x.savedAt)}</small>
                )}
                {out && <small className="oos">Out of stock</small>}
                <button type="button" className="btn btn-primary" disabled={out || busy === x.productId} onClick={() => moveToCart(x)}>
                  Move to cart
                </button>
                <button type="button" className="rm" disabled={busy === x.productId} onClick={() => remove(x)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ===========================================================================
   Your reviews
   =========================================================================== */

function StarsRO({ n }: { n: number }) {
  return (
    <span className="stars-ro" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <DayloraIcon key={i} name="star" className={`icon${i > n ? " off" : ""}`} />
      ))}
    </span>
  );
}

const REVIEW_PILL: Record<MyReview["status"], [string, string]> = {
  PUBLISHED: ["ok", "Published"],
  PENDING: ["grey", "In review"],
  REJECTED: ["grey", "Not published"],
};

export function ReviewsView() {
  const toast = useAccountToast();
  const [open, setOpen] = useState<{ key: string; stars: number } | null>(null);
  const { data, error, reload } = useLoad<MyReviews>(() =>
    shoppingService.getReviews().then((r) => r.data.data ?? { pending: [], reviews: [] })
  );

  async function del(r: MyReview) {
    try {
      await shoppingService.deleteReview(r.id);
      reload();
      toast({ title: "Review deleted" });
    } catch (e) {
      toast({ title: "Couldn't delete the review", body: getApiErrorMessage(e, "Try again in a moment.") });
    }
  }

  return (
    <>
      <ViewHead title="Your reviews" sub="Help other shoppers. Reviews appear on the product page after a quick check." />
      {!data ? (
        <Loading error={error} retry={reload} label="Loading your reviews" />
      ) : (
        <>
          <section className="card rv-card" aria-labelledby="tdH">
            <h2 id="tdH">Waiting for your review ({data.pending.length})</h2>
            {data.pending.length ? (
              data.pending.map((p) => {
                const key = p.orderItemId;
                const mine = open?.key === key ? open : null;
                return (
                  <div className="rv" key={key}>
                    <Thumb src={p.imageUrl} />
                    <div>
                      <b>{p.productName}</b>
                      <span className="note-sm">
                        {p.deliveredAt ? `Delivered ${fmtShort(p.deliveredAt)}` : `Order ${p.orderNumber}`}
                        {p.variant ? ` · ${p.variant}` : ""}
                      </span>
                      <div className="stars" role="group" aria-label={`Rate ${p.productName}`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <button
                            key={i}
                            type="button"
                            className={mine && i <= mine.stars ? "on" : undefined}
                            aria-label={`${i} star${i > 1 ? "s" : ""}`}
                            aria-pressed={mine ? i === mine.stars : false}
                            onClick={() => setOpen({ key, stars: i })}
                          >
                            <DayloraIcon name="star" />
                          </button>
                        ))}
                      </div>
                      {mine && (
                        <ReviewForm
                          item={p}
                          stars={mine.stars}
                          onCancel={() => setOpen(null)}
                          onDone={() => {
                            setOpen(null);
                            reload();
                            toast({ title: "Thanks for your review", body: "It'll appear on the product page after a quick check." });
                          }}
                          onGone={(msg) => {
                            setOpen(null);
                            reload();
                            toast({ title: msg });
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="note-sm">You&apos;re all caught up. New items appear here after delivery.</p>
            )}
          </section>
          <section className="card rv-card" aria-labelledby="pubH">
            <h2 id="pubH">Your reviews ({data.reviews.length})</h2>
            {data.reviews.length ? (
              data.reviews.map((r) => {
                const [tone, label] = REVIEW_PILL[r.status] ?? ["grey", r.status];
                return (
                  <div className="rv" key={r.id}>
                    <Thumb src={r.imageUrl} />
                    <div>
                      <b>{r.productName}</b>
                      <StarsRO n={r.rating} /> <span className={`pill ${tone}`}>{label}</span>
                      <p className="rv-title">{r.title}</p>
                      <p className="note-sm rv-body">{r.body}</p>
                      <div className="item-acts">
                        <button type="button" onClick={() => del(r)}>
                          Delete review
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="note-sm">Reviews you write show up here.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}

function ReviewForm({
  item,
  stars,
  onCancel,
  onDone,
  onGone,
}: {
  item: PendingReview;
  stars: number;
  onCancel: () => void;
  onDone: () => void;
  onGone: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [errs, setErrs] = useState<{ title?: string; body?: string }>({});
  const [fail, setFail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => titleRef.current?.focus(), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    const next = { title: t ? undefined : "Add a short title.", body: b.length >= 20 ? undefined : "Write at least 20 characters." };
    setErrs(next);
    if (next.title) return titleRef.current?.focus();
    if (next.body) return bodyRef.current?.focus();
    setBusy(true);
    setFail(null);
    try {
      await shoppingService.createReview({ productId: item.productId, rating: stars, title: t, body: b, recommend });
      onDone();
    } catch (err) {
      const s = statusCode(err);
      const data = (err as { response?: { data?: { data?: Record<string, unknown> } } })?.response?.data?.data;
      if (s === 409) return onGone("You've already reviewed this product");
      if (s === 400 && data && typeof data === "object") {
        setErrs({
          title: typeof data.title === "string" ? data.title : undefined,
          body: typeof data.body === "string" ? data.body : undefined,
        });
      }
      setFail(getApiErrorMessage(err, "We couldn't send your review. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const id = item.orderItemId;
  return (
    <form className="rv-form" noValidate onSubmit={submit}>
      <div className={`field${errs.title ? " bad" : ""}`}>
        <label htmlFor={`rvT-${id}`}>Title</label>
        <input
          ref={titleRef}
          id={`rvT-${id}`}
          maxLength={80}
          placeholder="Sum it up in a few words"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!errs.title || undefined}
          aria-describedby={errs.title ? `rvT-${id}-e` : undefined}
        />
        <p className="err" id={`rvT-${id}-e`}>
          {errs.title ?? "Add a short title."}
        </p>
      </div>
      <div className={`field${errs.body ? " bad" : ""}`}>
        <label htmlFor={`rvB-${id}`}>Your review</label>
        <textarea
          ref={bodyRef}
          id={`rvB-${id}`}
          maxLength={2000}
          placeholder="What did you like or not like? How did it fit or work?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={!!errs.body || undefined}
          aria-describedby={errs.body ? `rvB-${id}-e` : undefined}
        />
        <p className="err" id={`rvB-${id}-e`}>
          {errs.body ?? "Write at least 20 characters."}
        </p>
      </div>
      <label className="check">
        <input type="checkbox" checked={recommend} onChange={(e) => setRecommend(e.target.checked)} />
        <span>I&apos;d recommend this product</span>
      </label>
      {fail && !errs.title && !errs.body && (
        <div className="alert err" role="alert">
          <DayloraIcon name="alert" />
          <span>{fail}</span>
        </div>
      )}
      <div className="help-row">
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit review"}
        </button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
