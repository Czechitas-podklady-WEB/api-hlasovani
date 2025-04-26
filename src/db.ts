import { ulid } from "@std/ulid";
import data from "./data.js";

type Vote = {
  option: number;
  name: string;
};

type Option = {
  option: string,
  voters: string[]
}

type Poll = {
  question: string,
  options: Option[]
}

const kv = await Deno.openKv();

export const dbList = async (poll: number): Promise<Option[]> => {
  const options = data[poll].options;
  const result: Option[] = options.map(option => ({option, voters: []}));
  const entries = kv.list<Vote>({ prefix: ["poll", poll] });
  for await (const entry of entries) {
    result[entry.key[2]].voters.push(entry.value);
  }
  return result;
};

export const dbListAll = async (): Promise<Poll[]> => {
  const result: Poll[] = data.map(poll =>({
    question: poll.question,
    options: poll.options.map(option => ({
      option: option,
      voters: []
    }))
  }));
  const entries = kv.list<Vote>({ prefix: ["poll"] });
  for await (const entry of entries) {
    if (result[entry.key[1]] == null) {
      continue;
    }
    if (result[entry.key[1]].options[entry.key[2]] == null) {
      continue;
    }
    result[entry.key[1]].options[entry.key[2]].voters.push(entry.value);
  }
  return result;
};

export const dbAdd = async (poll: number, vote: Vote) => {
  const id = ulid();
  const result = await kv.set(["poll", poll, vote.option, id], vote.name);
  return {
    id,
    ...vote,
  };
};

export const dbDeleteAll = async (): Promise<void> => {
  await kv.delete(["poll"]);
};
