{
  pkgs ? import <nixpkgs> {}
}:

let latestPkgs = import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/1460b3e9052d520a243224175395c3ace3526d1b.tar.gz") {};

in pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.typescript-language-server
    latestPkgs.prisma-engines
  ];

  shellHook = ''
    export PRISMA_QUERY_ENGINE_LIBRARY=${latestPkgs.prisma-engines}/lib/libquery_engine.node
    export PRISMA_MIGRATION_ENGINE_BINARY=${latestPkgs.prisma-engines}/bin/migration-engine
  '';
}
