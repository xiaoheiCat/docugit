# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_17.04.15_60d78d"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_17.04.15_60d78d/docugit-darwin-arm64"
      sha256 "864661a9b6dd9996a44e981285b3c22d3c828b942aff4423ce870eb97b27e309"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_17.04.15_60d78d/docugit-darwin-amd64"
      sha256 "2f5d37c1b9e6de95173c92ed54a2733e7ddea453e41583317951c422395c0dc7"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_17.04.15_60d78d/docugit-linux-arm64"
      sha256 "9f11f0e76ebe507c7da16c4e7454af51ed59c6a8882eea0c583ea997249127e2"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_17.04.15_60d78d/docugit-linux-amd64"
      sha256 "36e46193ae827a0dd81a3fe4f00382cf270394c46d11de42fc5e84c389e2b8f7"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
