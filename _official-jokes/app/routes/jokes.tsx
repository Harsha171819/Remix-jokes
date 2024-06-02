import type { LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

import stylesUrl from "~/styles/jokes.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const selectedUserId = url.searchParams.get("userId") || undefined;
  const searchQuery = url.searchParams.get("searchQuery") || '';
  const sortOrder = url.searchParams.get("sortOrder") || 'desc';
  const user = await getUser(request);

  const users = await db.user.findMany({
    select: { id: true, username: true },
  });

  const jokeListItems = user
    ? await db.joke.findMany({
        orderBy: { name: sortOrder },
        select: { id: true, name: true },
        where: { jokesterId: selectedUserId || user.id,  name: { contains: searchQuery }  },
      })
    : [];

  return json({ jokeListItems, user, users, selectedUserId });
};

export default function JokesRoute() {
  const data = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSortByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value);
  };

  const handleSortOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(event.target.value);
  };

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          {data.user ? (
            <div className="user-info">
              <span>{`Hi ${data.user.username}`}</span>
              <Form action="/logout" method="post">
                <button type="submit" className="button">
                  Logout
                </button>
              </Form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="jokes-main bg-gray-100 py-6">
        <div className="container mx-auto p-4 bg-white shadow rounded">
          <div className="jokes-header mb-4">
            <h1 className="text-2xl font-bold text-center">Jokes App</h1>
            <div className="user-selection mt-4 flex justify-center">
              <Form method="get" className="flex space-x-2">
                <select
                  className="border border-gray-300 rounded p-2"
                  name="userId"
                  defaultValue={data.selectedUserId || ""}
                  onChange={(e) => {
                    const url = new URL(window.location.toString());
                    url.searchParams.set("userId", e.target.value);
                    window.location.href = url.toString();
                  }}
                >
                  <option value="">Select a user</option>
                  {data.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
                <input
                  name='searchQuery' 
                  type="text"
                  placeholder="Search jokes"
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                />
              <select name='sortOrder' onChange={handleSortOrderChange} value={sortOrder}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
                <button type="submit" className="button bg-blue-500 text-white py-2 px-4 rounded">
                  Filter
                </button>
              </Form>
            </div>
          </div>
          <div className="jokes-content grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="jokes-list bg-white p-4 shadow rounded">
              {/* <Link to="." className="text-blue-500">Get a random joke</Link> */}
              <p className="mt-2">Jokes</p>
              <ul className="list-disc list-inside">
                {data.jokeListItems.length > 0 ? (
                  data.jokeListItems.map(({ id, name }) => (
                    <li key={id} className="mt-2">
                      <Link prefetch="intent" to={id} className="text-blue-500">
                        {name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li>No jokes found</li>
                )}
              </ul>
              <Link to="new" className="button bg-blue-500 text-white mt-4 inline-block py-2 px-4 rounded">
                Add your own
              </Link>
            </div>
            {/* <div className="jokes-outlet bg-white p-4 shadow rounded">
              <Outlet />
            </div> */}
          </div>
        </div>
      </main>
      <footer className="jokes-footer">
        <div className="container">
          <Link reloadDocument to="/jokes.rss">
            RSS
          </Link>
        </div>
      </footer>
    </div>
  );
}
