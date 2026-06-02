# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_11.31.00_d2d5d9"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_11.31.00_d2d5d9/docugit-darwin-arm64"
      sha256 "1673da0db35f6370d24c987d584075294ab38265a14409216d043c7e627cf58c"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_11.31.00_d2d5d9/docugit-darwin-amd64"
      sha256 "0758d6923f5659b31d5e16deff885a5a39e94ffedb0db0d46c3980334d9bda6e"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_11.31.00_d2d5d9/docugit-linux-arm64"
      sha256 "9338a2a702841bbea4b719eea98b0865fc8eaaea41787d8b51543942ddc5a4d7"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_11.31.00_d2d5d9/docugit-linux-amd64"
      sha256 "3b1d33861a35a05cdc4561c760b4d7df6a5aa15899cad5240ba2b145d4a2d6d2"
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
