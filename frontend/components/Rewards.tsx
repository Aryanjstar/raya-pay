"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Reward } from "@/lib/types";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Modal } from "./ui/Modal";
import styles from "./Rewards.module.css";

export function Rewards() {
  const qc = useQueryClient();
  const rewards = useQuery({ queryKey: ["rewards"], queryFn: api.rewards });
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: api.wallet });
  const [pick, setPick] = useState<Reward | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redeem = useMutation({
    mutationFn: (id: string) => api.redeem(id),
    onMutate: async (id) => {
      const reward = rewards.data?.find((r) => r.id === id);
      await qc.cancelQueries({ queryKey: ["wallet"] });
      const prev = qc.getQueryData<{ balance: number }>(["wallet"]);
      if (prev && reward) {
        qc.setQueryData(["wallet"], { balance: prev.balance - reward.coin_cost });
      }
      return { prev };
    },
    onError: (err: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["wallet"], ctx.prev);
      setNotice(err.message);
    },
    onSuccess: (data) => {
      qc.setQueryData(["wallet"], { balance: data.balance });
      setNotice(`Redeemed. New balance: ${data.balance} coins.`);
      setPick(null);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  const balance = wallet.data?.balance ?? 0;

  return (
    <>
      <Card title="Redeem coins">
        {rewards.isError && <p className="error-banner">Could not load rewards.</p>}
        <div className="rewards-grid">
          {(rewards.data ?? []).map((r) => {
            const tooPoor = balance < r.coin_cost;
            return (
              <article key={r.id} className={styles.item}>
                <h3>{r.name}</h3>
                <p>{r.description}</p>
                <div className={styles.row}>
                  <span className={styles.cost}>{r.coin_cost} coins</span>
                  <Button
                    variant="gold"
                    disabled={tooPoor || redeem.isPending}
                    onClick={() => {
                      setNotice(null);
                      setPick(r);
                    }}
                  >
                    Redeem
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        {notice && <p className="muted">{notice}</p>}
      </Card>

      <Modal
        open={!!pick}
        title="Confirm redeem"
        onClose={() => setPick(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPick(null)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              disabled={!pick || redeem.isPending}
              onClick={() => pick && redeem.mutate(pick.id)}
            >
              {redeem.isPending ? "Redeeming…" : "Confirm"}
            </Button>
          </>
        }
      >
        {pick && (
          <p>
            Spend <strong>{pick.coin_cost}</strong> coins on <strong>{pick.name}</strong>? This cannot be undone
            from the dashboard.
          </p>
        )}
        {redeem.isError && <p className="error-banner">{(redeem.error as Error).message}</p>}
      </Modal>
    </>
  );
}
